import { useEffect, useState } from 'react';
import { promotionService } from '../services/promotionService';
import { productService } from '../services/productService';

export default function PromotionSettingsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name:'', discountType:'PERCENTAGE', discountValue:0, startDate:'', endDate:'', isActive:true, productIds:[] });
  const load = async () => { setPromotions(await promotionService.list()); const p = await productService.getAll(); setProducts(p.data?.products || p.data || []); };
  useEffect(() => { load(); }, []);
  const submit = async (e:any) => { e.preventDefault(); await promotionService.create(form); setForm({ name:'', discountType:'PERCENTAGE', discountValue:0, startDate:'', endDate:'', isActive:true, productIds:[] }); load(); };
  return <div><h1 className='text-2xl font-bold mb-4'>🎯 Promociones automáticas</h1><form onSubmit={submit} className='grid grid-cols-2 gap-3 mb-6'><input className='border p-2' placeholder='Nombre' value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><select className='border p-2' value={form.discountType} onChange={e=>setForm({...form,discountType:e.target.value})}><option value='PERCENTAGE'>%</option><option value='FIXED'>Fijo</option></select><input className='border p-2' type='number' value={form.discountValue} onChange={e=>setForm({...form,discountValue:Number(e.target.value)})}/><input className='border p-2' type='datetime-local' value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/><input className='border p-2' type='datetime-local' value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/><select multiple className='border p-2 col-span-2' value={form.productIds} onChange={e=>setForm({...form,productIds:Array.from(e.target.selectedOptions).map((x:any)=>x.value)})}>{products.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select><button className='bg-blue-600 text-white rounded p-2 col-span-2'>Crear promoción</button></form><ul>{promotions.map((p:any)=><li key={p.id} className='border rounded p-2 mb-2 flex justify-between'><span>{p.name} - {p.discountType} {p.discountValue}</span><button onClick={()=>promotionService.remove(p.id).then(load)} className='text-red-600'>Eliminar</button></li>)}</ul></div>;
}
