'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  Building2,
  User,
  MapPin,
  Hash,
  Landmark,
  CreditCard,
  Globe2,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { ContractPreview } from './ContractPreview';
import { useTranslations } from '@/components/providers/LocaleProvider';
import type { TranslateFn } from '@/lib/i18n-translator';

// ─── Validation Schema ────────────────────────────────────────────────────────

const innRegex = /^\d{3}\s\d{3}\s\d{3}$/;

function buildSchema(t: TranslateFn) {
  return z
    .object({
      companyName: z.string().min(2, t('contractPage.errors.min2')).max(200),
      companyDirector: z.string().min(2, t('contractPage.errors.min2')).max(200),
      companyAddress: z.string().min(5, t('contractPage.errors.minAddress')).max(300),
      companyInn: z.string().regex(innRegex, t('contractPage.errors.innFormat')),
      companyBank: z.string().min(2, t('contractPage.errors.min2')).max(200),
      bankMfo: z.string().regex(/^\d{5}$/, t('contractPage.errors.mfoFormat')),
      bankInn: z.string().regex(innRegex, t('contractPage.errors.innFormat')),
      bankNum: z.string().min(16, t('contractPage.errors.accountInvalid')).max(30),
      bankCurrency: z.enum(['UZS', 'USD']),
      hasCorrespondent: z.boolean(),
      bankCorrName: z.string().optional(),
      bankCorrAddress: z.string().optional(),
      bankCorrSwift: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.hasCorrespondent) {
        if (!data.bankCorrName || data.bankCorrName.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('contractPage.errors.corrName'),
            path: ['bankCorrName'],
          });
        }
        if (!data.bankCorrAddress || data.bankCorrAddress.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('contractPage.errors.corrAddress'),
            path: ['bankCorrAddress'],
          });
        }
        if (!data.bankCorrSwift || data.bankCorrSwift.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('contractPage.errors.swiftMin'),
            path: ['bankCorrSwift'],
          });
        }
      }
    });
}

export type ContractFormData = z.infer<ReturnType<typeof buildSchema>>;

// ─── Helper: Format INN input ─────────────────────────────────────────────────
function formatInn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, error, required, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#042C53]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-red-500"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

function Input({ hasError, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#042C53]
        placeholder:text-slate-400 outline-none transition-all
        ${hasError
          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
          : 'border-slate-200 focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/10'
        }
        ${className}
      `}
    />
  );
}

// ─── Step 1: Company Info ─────────────────────────────────────────────────────

function StepCompany({ form, t }: { form: ReturnType<typeof useForm<ContractFormData>>; t: TranslateFn }) {
  const { register, formState: { errors }, setValue, watch } = form;

  const handleInnChange = (field: 'companyInn') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(field, formatInn(e.target.value), { shouldValidate: true });
  };

  return (
    <motion.div
      key="step-company"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#042C53]/10">
          <Building2 className="h-5 w-5 text-[#042C53]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#042C53]">{t('contractPage.company.heading')}</h3>
          <p className="text-xs text-slate-500">{t('contractPage.company.subheading')}</p>
        </div>
      </div>

      <Field label={t('contractPage.company.name.label')} error={errors.companyName?.message} required>
        <Input
          {...register('companyName')}
          hasError={!!errors.companyName}
          placeholder={t('contractPage.company.name.placeholder')}
        />
      </Field>

      <Field
        label={t('contractPage.company.director.label')}
        error={errors.companyDirector?.message}
        required
        hint={t('contractPage.company.director.hint')}
      >
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            {...register('companyDirector')}
            hasError={!!errors.companyDirector}
            placeholder={t('contractPage.company.director.placeholder')}
            className="pl-10"
          />
        </div>
      </Field>

      <Field label={t('contractPage.company.address.label')} error={errors.companyAddress?.message} required>
        <div className="relative">
          <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <textarea
            {...register('companyAddress')}
            placeholder={t('contractPage.company.address.placeholder')}
            rows={2}
            className={`
              w-full rounded-xl border bg-white px-4 py-3 pl-10 text-sm text-[#042C53]
              placeholder:text-slate-400 outline-none transition-all resize-none
              ${errors.companyAddress
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-slate-200 focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/10'
              }
            `}
          />
        </div>
        {errors.companyAddress && (
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" />
            {errors.companyAddress?.message}
          </p>
        )}
      </Field>

      <Field
        label={t('contractPage.company.inn.label')}
        error={errors.companyInn?.message}
        required
        hint={t('contractPage.company.inn.hint')}
      >
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={watch('companyInn') || ''}
            onChange={handleInnChange('companyInn')}
            hasError={!!errors.companyInn}
            placeholder={t('contractPage.company.inn.placeholder')}
            maxLength={11}
            className="pl-10 font-mono tracking-wider"
          />
        </div>
      </Field>
    </motion.div>
  );
}

// ─── Step 2: Bank Info ────────────────────────────────────────────────────────

function StepBank({ form, t }: { form: ReturnType<typeof useForm<ContractFormData>>; t: TranslateFn }) {
  const { register, formState: { errors }, setValue, watch } = form;
  const hasCorrespondent = watch('hasCorrespondent');
  const bankCurrency = watch('bankCurrency');

  const handleInnChange = (field: 'bankInn') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(field, formatInn(e.target.value), { shouldValidate: true });
  };

  const handleMfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setValue('bankMfo', val, { shouldValidate: true });
  };

  return (
    <motion.div
      key="step-bank"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#042C53]/10">
          <Landmark className="h-5 w-5 text-[#042C53]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#042C53]">{t('contractPage.bank.heading')}</h3>
          <p className="text-xs text-slate-500">{t('contractPage.bank.subheading')}</p>
        </div>
      </div>

      <Field label={t('contractPage.bank.name.label')} error={errors.companyBank?.message} required>
        <Input
          {...register('companyBank')}
          hasError={!!errors.companyBank}
          placeholder={t('contractPage.bank.name.placeholder')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t('contractPage.bank.mfo.label')}
          error={errors.bankMfo?.message}
          required
          hint={t('contractPage.bank.mfo.hint')}
        >
          <Input
            value={watch('bankMfo') || ''}
            onChange={handleMfoChange}
            hasError={!!errors.bankMfo}
            placeholder={t('contractPage.bank.mfo.placeholder')}
            maxLength={5}
            className="font-mono tracking-wider"
          />
        </Field>

        <Field
          label={t('contractPage.bank.inn.label')}
          error={errors.bankInn?.message}
          required
          hint={t('contractPage.bank.inn.hint')}
        >
          <Input
            value={watch('bankInn') || ''}
            onChange={handleInnChange('bankInn')}
            hasError={!!errors.bankInn}
            placeholder={t('contractPage.bank.inn.placeholder')}
            maxLength={11}
            className="font-mono tracking-wider"
          />
        </Field>
      </div>

      <Field label={t('contractPage.bank.account.label')} error={errors.bankNum?.message} required>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            {...register('bankNum')}
            hasError={!!errors.bankNum}
            placeholder={t('contractPage.bank.account.placeholder')}
            className="pl-10 font-mono tracking-wider"
          />
        </div>
      </Field>

      <Field label={t('contractPage.bank.currency.label')} error={errors.bankCurrency?.message} required>
        <div className="flex gap-3">
          {(['UZS', 'USD'] as const).map((cur) => (
            <button
              key={cur}
              type="button"
              onClick={() => setValue('bankCurrency', cur, { shouldValidate: true })}
              className={`
                flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all
                ${bankCurrency === cur
                  ? 'border-[#185FA5] bg-[#042C53] text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-[#185FA5]/50'
                }
              `}
            >
              {cur === 'UZS'
                ? t('contractPage.bank.currency.uzs')
                : t('contractPage.bank.currency.usd')}
            </button>
          ))}
        </div>
      </Field>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-[#042C53]" />
            <div>
              <p className="text-sm font-medium text-[#042C53]">{t('contractPage.bank.correspondent.label')}</p>
              <p className="text-xs text-slate-500">{t('contractPage.bank.correspondent.hint')}</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hasCorrespondent}
            onClick={() => setValue('hasCorrespondent', !hasCorrespondent, { shouldValidate: true })}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${hasCorrespondent ? 'bg-[#042C53]' : 'bg-slate-300'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform
                ${hasCorrespondent ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        <AnimatePresence>
          {hasCorrespondent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
                <Field
                  label={t('contractPage.bank.correspondent.name.label')}
                  error={errors.bankCorrName?.message}
                  required
                >
                  <Input
                    {...register('bankCorrName')}
                    hasError={!!errors.bankCorrName}
                    placeholder={t('contractPage.bank.correspondent.name.placeholder')}
                  />
                </Field>
                <Field
                  label={t('contractPage.bank.correspondent.address.label')}
                  error={errors.bankCorrAddress?.message}
                  required
                >
                  <Input
                    {...register('bankCorrAddress')}
                    hasError={!!errors.bankCorrAddress}
                    placeholder={t('contractPage.bank.correspondent.address.placeholder')}
                  />
                </Field>
                <Field
                  label={t('contractPage.bank.correspondent.swift.label')}
                  error={errors.bankCorrSwift?.message}
                  required
                  hint={t('contractPage.bank.correspondent.swift.hint')}
                >
                  <Input
                    {...register('bankCorrSwift')}
                    hasError={!!errors.bankCorrSwift}
                    placeholder={t('contractPage.bank.correspondent.swift.placeholder')}
                    className="uppercase font-mono tracking-widest"
                    onChange={(e) => setValue('bankCorrSwift', e.target.value.toUpperCase(), { shouldValidate: true })}
                    value={watch('bankCorrSwift') || ''}
                  />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContractForm() {
  const t = useTranslations();
  const contractSchema = useMemo(() => buildSchema(t), [t]);

  const STEPS = useMemo(
    () => [
      { id: 0, label: t('contractPage.steps.company'), icon: Building2 },
      { id: 1, label: t('contractPage.steps.bank'), icon: Landmark },
      { id: 2, label: t('contractPage.steps.preview'), icon: Eye },
    ],
    [t],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [contractResult, setContractResult] = useState<{
    contractNumber: number;
    contractDate: string;
    data: ContractFormData;
  } | null>(null);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      companyName: '',
      companyDirector: '',
      companyAddress: '',
      companyInn: '',
      companyBank: '',
      bankMfo: '',
      bankInn: '',
      bankNum: '',
      bankCurrency: 'UZS',
      hasCorrespondent: false,
      bankCorrName: '',
      bankCorrAddress: '',
      bankCorrSwift: '',
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = form;

  const step0Fields = ['companyName', 'companyDirector', 'companyAddress', 'companyInn'] as const;
  const step1Fields = ['companyBank', 'bankMfo', 'bankInn', 'bankNum', 'bankCurrency', 'bankCorrName', 'bankCorrAddress', 'bankCorrSwift'] as const;

  const handleNext = useCallback(async () => {
    const fieldsToValidate = currentStep === 0 ? step0Fields : step1Fields;
    const valid = await trigger(fieldsToValidate as Parameters<typeof trigger>[0]);
    if (valid) setCurrentStep((s) => s + 1);
  }, [currentStep, trigger]);

  const onSubmit = useCallback(
    async (data: ContractFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const res = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || t('contractPage.errors.genericServer'));
        }
        const result = await res.json();
        setContractResult(result);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : t('contractPage.errors.generic'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [t],
  );

  if (contractResult) {
    return (
      <ContractPreview
        contractNumber={contractResult.contractNumber}
        contractDate={contractResult.contractDate}
        data={contractResult.data}
        onNew={() => {
          setContractResult(null);
          setCurrentStep(0);
          form.reset();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <nav aria-label={t('contractPage.stepsAria')}>
        <ol className="flex items-center justify-center gap-0">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;
            return (
              <li key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted
                        ? '#185FA5'
                        : isCurrent
                        ? '#042C53'
                        : '#e2e8f0',
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full shadow-sm"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <StepIcon
                        className={`h-5 w-5 ${isCurrent ? 'text-white' : 'text-slate-400'}`}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-[#042C53]' : isCompleted ? 'text-[#185FA5]' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-3 mb-5 h-0.5 w-16 sm:w-24 transition-colors duration-500 ${
                      currentStep > idx ? 'bg-[#185FA5]' : 'bg-slate-200'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {currentStep === 0 && <StepCompany key="s0" form={form} t={t} />}
              {currentStep === 1 && <StepBank key="s1" form={form} t={t} />}
              {currentStep === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  <PreviewStep formValues={form.getValues()} t={t} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-6 sm:mx-8 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {submitError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 sm:px-8">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-[#042C53] hover:bg-slate-100 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('contractPage.buttons.back')}
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-[#042C53] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#185FA5] transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                {t('contractPage.buttons.next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#042C53] to-[#185FA5] px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('contractPage.buttons.submitting')}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    {t('contractPage.buttons.submit')}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Preview Summary (step 2) ─────────────────────────────────────────────────

function PreviewStep({ formValues, t }: { formValues: ContractFormData; t: TranslateFn }) {
  const labels = {
    company: t('contractPage.review.labels.company'),
    director: t('contractPage.review.labels.director'),
    address: t('contractPage.review.labels.address'),
    companyInn: t('contractPage.review.labels.companyInn'),
    bank: t('contractPage.review.labels.bank'),
    mfo: t('contractPage.review.labels.mfo'),
    bankInn: t('contractPage.review.labels.bankInn'),
    account: t('contractPage.review.labels.account'),
    currency: t('contractPage.review.labels.currency'),
    corrBank: t('contractPage.review.labels.corrBank'),
    corrAddress: t('contractPage.review.labels.corrAddress'),
    swift: t('contractPage.review.labels.swift'),
  };

  const rows = [
    { label: labels.company, value: formValues.companyName },
    { label: labels.director, value: formValues.companyDirector },
    { label: labels.address, value: formValues.companyAddress },
    { label: labels.companyInn, value: formValues.companyInn },
    null,
    { label: labels.bank, value: formValues.companyBank },
    { label: labels.mfo, value: formValues.bankMfo },
    { label: labels.bankInn, value: formValues.bankInn },
    { label: labels.account, value: formValues.bankNum },
    { label: labels.currency, value: formValues.bankCurrency },
    ...(formValues.hasCorrespondent
      ? [
          null,
          { label: labels.corrBank, value: formValues.bankCorrName },
          { label: labels.corrAddress, value: formValues.bankCorrAddress },
          { label: labels.swift, value: formValues.bankCorrSwift },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
          <Eye className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-[#042C53]">{t('contractPage.review.heading')}</h3>
          <p className="text-xs text-slate-500">{t('contractPage.review.subheading')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 overflow-hidden">
        {rows.map((row, i) =>
          row === null ? (
            <div key={`sep-${i}`} className="h-px bg-slate-100" />
          ) : (
            <div
              key={row.label}
              className={`flex items-start gap-4 px-4 py-3 text-sm ${
                i % 2 === 0 ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              <span className="w-40 shrink-0 font-medium text-slate-500">{row.label}</span>
              <span className="text-[#042C53] font-medium break-all">{row.value || '—'}</span>
            </div>
          ),
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{t('contractPage.review.warning')}</span>
      </div>
    </div>
  );
}
