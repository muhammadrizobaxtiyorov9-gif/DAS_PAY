/**
 * Renders a JSON-LD <script> tag for a Schema.org payload.
 * Use once per page per schema type (multiple per page is fine).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}