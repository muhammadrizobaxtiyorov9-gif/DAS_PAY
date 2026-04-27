import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { log } from './logger';

/**
 * OCR helpers — pull structured data out of scanned/photographed documents
 * using Claude's vision API. Three document types are supported today:
 *
 *   - 'cmr'      — international waybill (sender, receiver, route, weight)
 *   - 'inn'      — Uzbekistan tax ID certificate
 *   - 'passport' — Uzbekistan passport / national ID
 *
 * Why Claude over GPT: stronger at Cyrillic and Uzbek text, native
 * structured outputs (no manual JSON parsing), and Opus 4.7's high-res
 * vision (up to 2576px on the long edge) keeps small print legible.
 *
 * The model is asked for a Zod-validated JSON object so the response
 * shape is guaranteed at runtime — callers don't need to defensively
 * parse strings.
 */

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  _client = new Anthropic();
  return _client;
}

const MODEL = process.env.ANTHROPIC_OCR_MODEL || 'claude-opus-4-7';

export type DocumentKind = 'cmr' | 'inn' | 'passport';

// ── Schemas ─────────────────────────────────────────────────────────────────

const CmrSchema = z.object({
  senderName: z.string().optional(),
  senderAddress: z.string().optional(),
  senderInn: z.string().optional(),
  receiverName: z.string().optional(),
  receiverAddress: z.string().optional(),
  receiverInn: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  cargoDescription: z.string().optional(),
  weightTons: z.number().optional(),
  packagesCount: z.number().optional(),
  vehiclePlate: z.string().optional(),
  cmrNumber: z.string().optional(),
  issueDate: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

const InnSchema = z.object({
  inn: z.string().optional(),
  companyName: z.string().optional(),
  director: z.string().optional(),
  registrationDate: z.string().optional(),
  address: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

const PassportSchema = z.object({
  fullName: z.string().optional(),
  passportNumber: z.string().optional(),
  pinfl: z.string().optional(),
  birthDate: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  nationality: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type CmrFields = Omit<z.infer<typeof CmrSchema>, 'confidence'>;
export type InnFields = Omit<z.infer<typeof InnSchema>, 'confidence'>;
export type PassportFields = Omit<z.infer<typeof PassportSchema>, 'confidence'>;

const SCHEMAS = {
  cmr: CmrSchema,
  inn: InnSchema,
  passport: PassportSchema,
} as const;

// ── Prompts ─────────────────────────────────────────────────────────────────

const PROMPTS: Record<DocumentKind, string> = {
  cmr: `Extract the fields from this CMR (international waybill) scan.
Use ISO date strings (YYYY-MM-DD). Omit any field you cannot read confidently.
NEVER invent values. The original may be in Russian, Uzbek, or English.
"confidence" is your overall confidence in the extraction (0..1).`,
  inn: `Extract the fields from this Uzbekistan tax ID (INN) certificate.
INN must be the 9-digit code. Use ISO dates. Omit unreadable fields.
The certificate is typically in Uzbek or Russian.
NEVER invent values. "confidence" is your overall confidence (0..1).`,
  passport: `Extract the fields from this Uzbekistan passport or ID card.
Use ISO dates (YYYY-MM-DD). PINFL must be 14 digits. Omit unreadable fields.
NEVER invent values — if unsure of any character, omit the entire field.
"confidence" is your overall confidence in the extraction (0..1).`,
};

// ── Public API ──────────────────────────────────────────────────────────────

export interface OcrResult<T> {
  ok: boolean;
  fields: T;
  /** Confidence 0..1 — model's self-rated confidence. */
  confidence?: number;
  error?: string;
}

/**
 * Extract a typed payload from a document image. Pass a `data:` URL
 * (e.g. `data:image/jpeg;base64,...`) to keep callers free from filesystem
 * concerns. The shape of `fields` follows the CMR/INN/Passport schema for
 * the requested `kind`.
 */
export async function extractDocument(
  kind: DocumentKind,
  imageDataUrl: string,
): Promise<OcrResult<CmrFields | InnFields | PassportFields>> {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) {
    return {
      ok: false,
      fields: {},
      error: 'invalid_data_url',
    };
  }

  try {
    const schema = SCHEMAS[kind];
    const response = await client().messages.parse({
      model: MODEL,
      max_tokens: 1024,
      // Adaptive thinking lets Claude reason longer when text is unclear,
      // and skip thinking entirely on clean scans — the right balance for OCR.
      thinking: { type: 'adaptive' },
      output_config: {
        format: zodOutputFormat(schema),
        effort: 'medium',
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: parsed.mediaType,
                data: parsed.base64,
              },
            },
            { type: 'text', text: PROMPTS[kind] },
          ],
        },
      ],
    });

    if (!response.parsed_output) {
      return {
        ok: false,
        fields: {},
        error: 'parse_failed',
      };
    }

    const { confidence, ...fields } = response.parsed_output;
    return {
      ok: true,
      fields,
      confidence,
    };
  } catch (err) {
    log.error('ocr.extract_failed', { kind, err });
    return {
      ok: false,
      fields: {},
      error: (err as Error).message,
    };
  }
}

/** Convenience typed wrappers so call sites get autocompletion. */
export const extractCmr = (img: string) =>
  extractDocument('cmr', img) as Promise<OcrResult<CmrFields>>;
export const extractInn = (img: string) =>
  extractDocument('inn', img) as Promise<OcrResult<InnFields>>;
export const extractPassport = (img: string) =>
  extractDocument('passport', img) as Promise<OcrResult<PassportFields>>;

// ── Helpers ─────────────────────────────────────────────────────────────────

type SupportedMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

interface ParsedDataUrl {
  mediaType: SupportedMime;
  base64: string;
}

function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!match) return null;
  return {
    mediaType: match[1] as SupportedMime,
    base64: match[2],
  };
}
