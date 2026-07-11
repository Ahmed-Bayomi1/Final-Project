import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const reqBody = await req.json()
    const origin = req.headers.get('origin') || 'http://localhost:5173'

    // 1. تحديد مكان بيانات المنتج (بندعم لو الفرونت إند باعتها جوه items أو بشكل مباشر)
    const productData = (reqBody.items && reqBody.items.length > 0) 
      ? reqBody.items[0] 
      : reqBody;

    // 2. استخراج السعر والتأكد إنه رقم مش نص
    const rawPrice = productData.price || productData.unitPrice || productData.amount || 0;
    const finalPrice = Number(rawPrice);

    // 3. لو السعر لسه بصفر، هنوقف العملية ونرجع رسالة توضح المشكلة
    if (finalPrice <= 0) {
      throw new Error("السعر المبعوت من الموقع قيمته صفر أو غير مقروء. تأكد من اسم متغير السعر في React.");
    }

    // 4. إنشاء جلسة الدفع
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'egp', // عملة الجنيه المصري
            product_data: {
              name: productData.name || productData.medicineName || 'PharmaCare Reservation',
            },
            unit_amount: Math.round(finalPrice * 100), // ضرب السعر في 100 لتحويله لقروش
          },
          quantity: productData.quantity || 1,
        },
      ],
      success_url: `${origin}/reservation?success=true`,
      cancel_url: `${origin}/user?canceled=true`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})