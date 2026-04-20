'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Send, ArrowRight, Package, Truck, Train, MapPin, Loader2, Phone, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getQuote } from '@/app/actions/quote';
import { formatMoney } from '@/lib/money';
import type { QuoteResult } from '@/lib/quote';
import { StationAutocomplete } from '@/components/forms/StationAutocomplete';

const METHOD_TO_MODE: Record<string, string> = {
  rail: 'train',
  auto: 'truck',
};

export default function CalculatorPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [method, setMethod] = useState('rail');
  
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rail Specific
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [fromStationId, setFromStationId] = useState<number | null>(null);
  const [toStationId, setToStationId] = useState<number | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !weight) {
      toast.error('Iltimos barcha maydonlarni to\'ldiring');
      return;
    }

    if (method === 'rail' && (!fromStation || !toStation)) {
       toast.error('Temir yo\'l stansiyalarini to\'liq kiriting');
       return;
    }

    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) {
      toast.error('Og\'irlik xato kiritildi');
      return;
    }

    setCalculating(true);
    try {
      const result = await getQuote({
        originCountry: origin,
        destCountry: destination,
        mode: METHOD_TO_MODE[method] || 'train',
        weightTon: w,
      });
      setQuote(result);
    } catch (err) {
      toast.error('Narxni hisoblashda xatolik');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmitLead = async () => {
    if (!phone) {
      toast.error('Telefon raqamini kiriting');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Kalkulyator Mijozi',
          phone: phone,
          service: `Kalkulyator Arizasi`,
          message: `Yo'nalish: ${origin} -> ${destination}. Og'irlik: ${weight} tonna${method === 'rail' ? `. Stansiya: ${fromStation} → ${toStation}` : ''}`,
          transportType: method,
          fromStation: method === 'rail' ? fromStation : undefined,
          toStation: method === 'rail' ? toStation : undefined,
        }),
      });

      if (!response.ok) throw new Error('Xatolik yuz berdi');
      
      toast.success('Arizangiz muvaffaqiyatli yuborildi. Tez orada aloqaga chiqamiz!');
      setPhone('');
      setQuote(null);
    } catch (err) {
      toast.error('Ariza yuborishda xatolik yuz berdi. Iltimos qayta urining.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-secondary min-h-screen py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            <Calculator className="inline-block mb-2 mr-4 h-10 w-10 text-[#185FA5]" />
            Yuk narxini hisoblash
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Temir yo&apos;l va avtomobil tashuvlari uchun taxminiy narxni hisoblang va onlayn ariza qoldiring.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
          {/* Calculator Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-2xl shadow-xl border p-8"
          >
            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                   <Label>Qayerdan</Label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input required value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Masalan: Xitoy, Yivu" className="pl-10 h-12" />
                   </div>
                </div>
                <div className="grid gap-2">
                   <Label>Qayerga</Label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input required value={destination} onChange={e => setDestination(e.target.value)} placeholder="Masalan: O'zbekiston, Toshkent" className="pl-10 h-12" />
                   </div>
                </div>
                <div className="grid gap-2">
                   <Label>Transport turi</Label>
                   <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rail"><div className="flex items-center gap-2"><Train className="w-4 h-4"/> Temir yo&apos;l</div></SelectItem>
                        <SelectItem value="auto"><div className="flex items-center gap-2"><Truck className="w-4 h-4"/> Avtomobil</div></SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                {method === 'rail' && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="grid gap-4 bg-muted/30 p-4 rounded-xl border border-dashed">
                      <StationAutocomplete
                        label="Jo'nash stansiyasi"
                        placeholder="Stansiya nomi yoki kodi"
                        value={fromStation}
                        onSelect={(s) => {
                          if (s) {
                            setFromStation(s.nameUz);
                            setFromStationId(s.id);
                          } else {
                            setFromStation('');
                            setFromStationId(null);
                          }
                        }}
                      />
                      <StationAutocomplete
                        label="Borish stansiyasi"
                        placeholder="Stansiya nomi yoki kodi (Masalan: Chuqursoy)"
                        value={toStation}
                        onSelect={(s) => {
                          if (s) {
                            setToStation(s.nameUz);
                            setToStationId(s.id);
                          } else {
                            setToStation('');
                            setToStationId(null);
                          }
                        }}
                      />
                  </motion.div>
                )}
                 <div className="grid gap-2">
                   <Label>Yuk og&apos;irligi (tonna)</Label>
                   <div className="relative">
                     <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input required type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Masalan: 20" className="pl-10 h-12" />
                   </div>
                </div>
              </div>
              
              <Button type="submit" disabled={calculating} size="lg" className="w-full h-12 bg-[#042C53] hover:bg-[#185FA5] text-lg font-semibold shadow-lg transition-transform active:scale-[0.98]">
                {calculating ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
                Hisoblash <ArrowRight className="ml-2 w-5 h-5"/>
              </Button>
            </form>
          </motion.div>

          {/* Results & Lead Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            {quote === null ? (
               <div className="bg-muted/30 rounded-2xl border border-dashed flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
                 <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
                 <p className="text-muted-foreground mb-2 font-medium">Natijani ko&apos;rish uchun avval hisoblang</p>
                 <p className="text-sm text-muted-foreground/70">Xizmat va masofa narxga bevosita ta&apos;sir qiladi.</p>
               </div>
            ) : quote.noTariffFound ? (
              /* ── No tariff found — manager will calculate ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-2xl shadow-xl border border-amber-200 p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <UserCheck className="w-48 h-48" />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900">Menejerlar hisoblab beradi</h3>
                    <p className="text-sm text-amber-700/80">Ushbu yo&apos;nalish uchun maxsus tarif</p>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-100/60 border border-amber-200 p-4 mb-6">
                  <p className="text-sm text-amber-900 leading-relaxed">
                    <strong>{origin} → {destination}</strong> yo&apos;nalishi bo&apos;yicha
                    {method === 'rail' && fromStation && toStation && (
                      <span> ({fromStation} → {toStation} stansiyalari)</span>
                    )} {weight} tonna yuk uchun aniq narxni <strong>mutaxassis menejerlarimiz hisoblab, siz bilan aloqaga chiqishadi</strong>.
                  </p>
                </div>

                <div className="space-y-3 mb-6 text-sm text-amber-800/70">
                  <div className="flex justify-between border-b border-amber-200/60 pb-2">
                    <span>Yo&apos;nalish</span>
                    <span className="font-semibold text-amber-900">{origin} → {destination}</span>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/60 pb-2">
                    <span>Transport</span>
                    <span className="font-semibold text-amber-900">{method === 'rail' ? "Temir yo'l" : "Avtomobil"}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span>Og&apos;irlik</span>
                    <span className="font-semibold text-amber-900">{weight} tonna</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm">
                   <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                     <Send className="w-4 h-4" /> Ariza qoldiring — tez orada aloqaga chiqamiz
                   </h4>
                   <p className="text-xs text-amber-700/70 mb-4">
                     Menejerlarimiz 1 soat ichida aniq narx va shartlarni taqdim etishadi.
                   </p>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                     <Input 
                        placeholder="+998 90 123 45 67" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="h-12 border-amber-200 focus:border-amber-400" 
                     />
                     <Button 
                       disabled={isSubmitting}
                       onClick={handleSubmitLead}
                       className="h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8"
                     >
                       {isSubmitting ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <Send className="mr-2 w-4 h-4" />}
                       Jo&apos;natish
                     </Button>
                   </div>
                </div>
              </motion.div>
            ) : (
              /* ── Tariff found — show price ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#042C53] text-white rounded-2xl shadow-2xl p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                  <Calculator className="w-64 h-64" />
                </div>

                <h3 className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-sm">
                  {quote.tariffName || 'Tarif asosida narx'}
                </h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-black">{formatMoney(quote.price, quote.currency)}</span>
                  <span className="text-xl text-blue-200">dan boshlab</span>
                </div>

                <div className="space-y-3 mb-6 text-sm text-blue-100/80">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>{origin}</span> <ArrowRight className="w-4 h-4 mx-2" /> <span>{destination}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>Transport turi</span>
                    <span className="font-semibold text-white">
                       {method === 'rail' ? "Temir yo'l" : "Avtomobil"}
                    </span>
                  </div>
                  {method === 'rail' && fromStation && toStation && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span>Stansiyalar</span>
                      <span className="font-semibold text-white text-xs">
                         {fromStation} → {toStation}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>Og&apos;irlik</span>
                    <span className="font-semibold text-white">{weight} tonna{quote.breakdown.weightBilled !== parseFloat(weight) ? ` (min ${quote.breakdown.weightBilled} tonna)` : ''}</span>
                  </div>
                  {quote.breakdown.baseFee > 0 && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span>Asosiy haq</span>
                      <span className="font-semibold text-white">{formatMoney(quote.breakdown.baseFee, quote.currency)}</span>
                    </div>
                  )}
                  {quote.transitDays && (
                    <div className="flex justify-between pb-2">
                      <span>Tranzit</span>
                      <span className="font-semibold text-white">~{quote.transitDays} kun</span>
                    </div>
                  )}
                </div>

                <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/10">
                   <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                     <Send className="w-4 h-4" /> Narx bo&apos;yicha buyurtma qoldirish
                   </h4>
                   <p className="text-xs text-blue-100/70 mb-4">
                     Menejerlarimiz aniq narxni hisoblab, siz bilan bog&apos;lanishadi.
                   </p>
                   
                   <div className="flex flex-col sm:flex-row gap-3">
                     <Input 
                        placeholder="+998 90 123 45 67" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="bg-white/90 text-[#042C53] h-12 border-0 placeholder:text-gray-400" 
                     />
                     <Button 
                       disabled={isSubmitting}
                       onClick={handleSubmitLead}
                       className="h-12 bg-white text-[#042C53] hover:bg-gray-100 font-bold px-8 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                     >
                       Jo&apos;natish
                     </Button>
                   </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
