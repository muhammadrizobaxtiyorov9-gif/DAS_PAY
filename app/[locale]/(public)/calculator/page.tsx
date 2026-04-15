'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Send, ArrowRight, Package, Truck, Plane, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CalculatorPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [method, setMethod] = useState('auto');
  
  const [estimate, setEstimate] = useState<number | null>(null);
  
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rail Specific
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');

  // Simple mock calculation logic
  const handleCalculate = (e: React.FormEvent) => {
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

    let baseRate = 0;
    if (method === 'auto') baseRate = 2.5;
    if (method === 'rail') baseRate = 1.8;
    if (method === 'air') baseRate = 6.5;

    // Simulate complex distance calculation with random jitter based on text length
    const distanceFactor = Math.max(1, (origin.length + destination.length) * 0.1);
    
    const calculatedPrice = w * baseRate * distanceFactor;
    setEstimate(Math.round(calculatedPrice));
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
          message: `Yo'nalish: ${origin} -> ${destination}. Og'irlik: ${weight}kg`,
          transportType: method,
          fromStation: method === 'rail' ? fromStation : undefined,
          toStation: method === 'rail' ? toStation : undefined,
        }),
      });

      if (!response.ok) throw new Error('Xatolik yuz berdi');
      
      toast.success('Arizangiz muvaffaqiyatli yuborildi. Tez orada aloqaga chiqamiz!');
      setPhone('');
      setEstimate(null); // Reset after success
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
            Barcha turdagi xalqaro tashuvlar uchun taxminiy narxni hisoblang va onlayn ariza qoldiring.
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
                        <SelectItem value="auto"><div className="flex items-center gap-2"><Truck className="w-4 h-4"/> Fura (Avtomobil)</div></SelectItem>
                        <SelectItem value="rail"><div className="flex items-center gap-2"><Truck className="w-4 h-4"/> Temir yo'l</div></SelectItem>
                        <SelectItem value="air"><div className="flex items-center gap-2"><Plane className="w-4 h-4"/> Avia tashuv</div></SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                {method === 'rail' && (
                  <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="grid gap-4 bg-muted/30 p-4 rounded-xl border border-dashed">
                      <div className="grid gap-2">
                         <Label>Jo'nash stansiyasi</Label>
                         <Input required value={fromStation} onChange={e => setFromStation(e.target.value)} placeholder="Stansiya nomi yoki kodi" className="h-10" />
                      </div>
                      <div className="grid gap-2">
                         <Label>Borish stansiyasi</Label>
                         <Input required value={toStation} onChange={e => setToStation(e.target.value)} placeholder="Stansiya nomi yoki kodi (Masalan: Chuqursoy)" className="h-10" />
                      </div>
                  </motion.div>
                )}
                 <div className="grid gap-2">
                   <Label>Yuk og'irligi (kg)</Label>
                   <div className="relative">
                     <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input required type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Masalan: 1500" className="pl-10 h-12" />
                   </div>
                </div>
              </div>
              
              <Button type="submit" size="lg" className="w-full h-12 bg-[#042C53] hover:bg-[#185FA5] text-lg font-semibold shadow-lg transition-transform active:scale-[0.98]">
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
            {estimate === null ? (
               <div className="bg-muted/30 rounded-2xl border border-dashed flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
                 <Calculator className="w-16 h-16 text-muted-foreground/30 mb-4" />
                 <p className="text-muted-foreground mb-2 font-medium">Natijani ko'rish uchun avval hisoblang</p>
                 <p className="text-sm text-muted-foreground/70">Xizmat va masofa narxga bevosita ra'sir qiladi.</p>
               </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#042C53] text-white rounded-2xl shadow-2xl p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                  <Calculator className="w-64 h-64" />
                </div>
                
                <h3 className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-sm">Bashoratli narx</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-black">${estimate}</span>
                  <span className="text-xl text-blue-200">dan boshlab</span>
                </div>
                
                <div className="space-y-3 mb-8 text-sm text-blue-100/80">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>{origin}</span> <ArrowRight className="w-4 h-4 mx-2" /> <span>{destination}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>Transport turi</span> 
                    <span className="font-semibold text-white">
                       {method === 'auto' ? 'Fura (Avtomobil)' : method === 'rail' ? "Temir yo'l" : "Avia tashuv"}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span>Og'irligi</span>
                    <span className="font-semibold text-white">{weight} kg</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/10">
                   <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                     <Send className="w-4 h-4" /> Narx bo'yicha buyurtma qoldirish
                   </h4>
                   <p className="text-xs text-blue-100/70 mb-4">
                     Menejerlarimiz aniq narxni hisoblab, siz bilan bog'lanishadi.
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
                       Jo'natish
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
