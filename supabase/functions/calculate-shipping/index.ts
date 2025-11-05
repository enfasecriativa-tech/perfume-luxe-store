import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingRequest {
  cep: string;
  product_id: string;
}

interface MelhorEnvioResponse {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company: {
    name: string;
    picture: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cep, product_id }: ShippingRequest = await req.json();

    console.log('Calculating shipping for:', { cep, product_id });

    // Validate CEP
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get product details with dimensions
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('height, width, length, weight')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return new Response(
        JSON.stringify({ error: 'Produto não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate product has dimensions
    if (!product.height || !product.width || !product.length || !product.weight) {
      return new Response(
        JSON.stringify({ error: 'Produto sem dimensões cadastradas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare request to Melhor Envio API
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    if (!melhorEnvioToken) {
      console.error('MELHOR_ENVIO_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço de frete não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CEP de origem (você pode configurar isso)
    const fromCep = '89010100'; // Exemplo: Blumenau, SC

    const shippingData = {
      from: {
        postal_code: fromCep
      },
      to: {
        postal_code: cleanCep
      },
      products: [
        {
          id: product_id,
          width: Number(product.width),
          height: Number(product.height),
          length: Number(product.length),
          weight: Number(product.weight),
          insurance_value: 50, // Valor do seguro
          quantity: 1
        }
      ]
    };

    console.log('Calling Melhor Envio API with:', JSON.stringify(shippingData));

    // Call Melhor Envio API
    const melhorEnvioResponse = await fetch(
      'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${melhorEnvioToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Aplicação gestormkt.alexandre@gmail.com'
        },
        body: JSON.stringify(shippingData)
      }
    );

    if (!melhorEnvioResponse.ok) {
      const errorText = await melhorEnvioResponse.text();
      console.error('Melhor Envio API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao calcular frete' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shippingOptions: MelhorEnvioResponse[] = await melhorEnvioResponse.json();
    console.log('Shipping options received:', shippingOptions.length);

    if (!shippingOptions || shippingOptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma opção de frete disponível para este CEP' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find cheapest and fastest options
    const sortedByPrice = [...shippingOptions].sort((a, b) => 
      parseFloat(a.price) - parseFloat(b.price)
    );
    const sortedByTime = [...shippingOptions].sort((a, b) => 
      a.delivery_time - b.delivery_time
    );

    const cheapest = sortedByPrice[0];
    const fastest = sortedByTime[0];

    const result = {
      cheapest: {
        id: cheapest.id,
        name: cheapest.name,
        company: cheapest.company.name,
        price: parseFloat(cheapest.price),
        delivery_time: cheapest.delivery_time
      },
      fastest: cheapest.id === fastest.id ? null : {
        id: fastest.id,
        name: fastest.name,
        company: fastest.company.name,
        price: parseFloat(fastest.price),
        delivery_time: fastest.delivery_time
      },
      allOptions: shippingOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        company: opt.company.name,
        price: parseFloat(opt.price),
        delivery_time: opt.delivery_time
      }))
    };

    console.log('Returning shipping result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in calculate-shipping function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});