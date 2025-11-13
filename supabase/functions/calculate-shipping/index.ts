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
        JSON.stringify({ 
          error: 'CEP inválido',
          message: 'Por favor, verifique o CEP digitado.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        JSON.stringify({ 
          error: 'Produto não encontrado',
          message: 'Não foi possível encontrar as informações do produto.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate product has dimensions
    if (!product.height || !product.width || !product.length || !product.weight) {
      console.error('Product missing dimensions:', product);
      return new Response(
        JSON.stringify({ 
          error: 'Produto sem dimensões cadastradas',
          message: 'Entre em contato via WhatsApp para calcular o frete deste produto.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare request to Melhor Envio API
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    if (!melhorEnvioToken) {
      console.error('MELHOR_ENVIO_TOKEN not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Serviço de frete temporariamente indisponível',
          message: 'Entre em contato via WhatsApp para calcular o frete.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      console.error('Melhor Envio API error status:', melhorEnvioResponse.status);
      console.error('Melhor Envio API error:', errorText);
      
      // Tentar parsear o erro para obter mais detalhes
      let errorDetails = null;
      try {
        errorDetails = JSON.parse(errorText);
        console.error('Melhor Envio error details:', errorDetails);
      } catch (e) {
        console.error('Could not parse error as JSON');
      }
      
      // Se for erro 400 ou similar, pode ser CEP inválido ou muito próximo
      if (melhorEnvioResponse.status === 400) {
        return new Response(
          JSON.stringify({ 
            error: 'CEP inválido ou fora da área de cobertura',
            message: 'Para este endereço, entre em contato via WhatsApp para combinar a entrega.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao calcular frete',
          message: 'Não foi possível calcular o frete. Entre em contato via WhatsApp.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await melhorEnvioResponse.json();
    console.log('Melhor Envio response type:', typeof responseData);
    console.log('Melhor Envio response is array:', Array.isArray(responseData));
    console.log('Melhor Envio response:', JSON.stringify(responseData, null, 2));

    // Verificar se a resposta é um array ou um objeto de erro
    let shippingOptions: MelhorEnvioResponse[] = [];
    
    if (Array.isArray(responseData)) {
      // Resposta é um array de opções de frete
      shippingOptions = responseData.filter(opt => 
        opt && 
        opt.id && 
        opt.price && 
        opt.name &&
        opt.company &&
        opt.company.name &&
        typeof opt.delivery_time === 'number'
      );
      console.log('Filtered shipping options:', shippingOptions.length);
    } else if (responseData && typeof responseData === 'object') {
      // Verificar diferentes estruturas de erro possíveis
      if (responseData.error || responseData.message || responseData.errors) {
        const errorMsg = responseData.error || responseData.message || JSON.stringify(responseData.errors);
        console.error('Melhor Envio returned error object:', errorMsg);
        
        // Mesmo com erro, verificar se há opções de frete na resposta
        if (responseData.data && Array.isArray(responseData.data)) {
          shippingOptions = responseData.data.filter(opt => 
            opt && 
            opt.id && 
            opt.price && 
            opt.name &&
            opt.company &&
            opt.company.name &&
            typeof opt.delivery_time === 'number'
          );
          console.log('Found shipping options in data property:', shippingOptions.length);
        } else if (responseData.shipping_options && Array.isArray(responseData.shipping_options)) {
          shippingOptions = responseData.shipping_options.filter(opt => 
            opt && 
            opt.id && 
            opt.price && 
            opt.name &&
            opt.company &&
            opt.company.name &&
            typeof opt.delivery_time === 'number'
          );
          console.log('Found shipping options in shipping_options property:', shippingOptions.length);
        }
        
        // Se não encontrou opções e há erro, retornar erro apenas se realmente não houver opções
        if (shippingOptions.length === 0) {
          return new Response(
            JSON.stringify({ 
              error: 'CEP muito próximo ao remetente',
              message: 'Para entregas locais, entre em contato via WhatsApp para combinar a retirada ou entrega.'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Objeto sem erro explícito - pode conter dados em propriedades específicas
        console.log('Response is object without explicit error, checking for data...');
        if (responseData.data && Array.isArray(responseData.data)) {
          shippingOptions = responseData.data.filter(opt => 
            opt && 
            opt.id && 
            opt.price && 
            opt.name &&
            opt.company &&
            opt.company.name &&
            typeof opt.delivery_time === 'number'
          );
        } else if (responseData.shipping_options && Array.isArray(responseData.shipping_options)) {
          shippingOptions = responseData.shipping_options.filter(opt => 
            opt && 
            opt.id && 
            opt.price && 
            opt.name &&
            opt.company &&
            opt.company.name &&
            typeof opt.delivery_time === 'number'
          );
        } else {
          console.warn('Unexpected response structure:', Object.keys(responseData));
          // Tentar usar o próprio objeto como array se tiver estrutura similar
          if (responseData.id && responseData.price) {
            console.log('Single shipping option found in response object');
            shippingOptions = [responseData];
          }
        }
      }
    }

    console.log('Final shipping options count:', shippingOptions.length);

    if (!shippingOptions || shippingOptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Nenhuma opção de frete disponível',
          message: 'Para este CEP, entre em contato via WhatsApp para combinar a entrega.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        deliveryTime: cheapest.delivery_time
      },
      fastest: cheapest.id === fastest.id ? null : {
        id: fastest.id,
        name: fastest.name,
        company: fastest.company.name,
        price: parseFloat(fastest.price),
        deliveryTime: fastest.delivery_time
      },
      allOptions: shippingOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        company: opt.company.name,
        price: parseFloat(opt.price),
        deliveryTime: opt.delivery_time
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
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar solicitação',
        message: 'Não foi possível calcular o frete. Entre em contato via WhatsApp para mais informações.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});