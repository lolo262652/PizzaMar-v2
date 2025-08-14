import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Définition des en-têtes CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Réponse immédiate pour les requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔁 Starting create-phone-user function')

    // Création du client Supabase admin
    const supabaseAdmin = createClient(
      Deno.env.get('VITE_SUPABASE_URL') ?? '',
      Deno.env.get('VITE_SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log('✅ Supabase client initialized')

    // Lecture du corps de la requête avec validation JSON
    let body
    try {
      body = await req.json()
    } catch (e) {
      console.error('❌ Invalid JSON:', e)
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { phone, full_name, email } = body

    // Validation des champs obligatoires
    if (!phone || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Fields "phone" and "full_name" are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const tempPassword = Math.random().toString(36).slice(-12)
    const tempEmail = email || `${phone}-${Date.now()}@temp.pizzabuilder.com`

    console.log('📧 Temp email generated:', tempEmail)

    // Création de l'utilisateur dans Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      phone: phone,
      user_metadata: {
        full_name: full_name,
        phone: phone,
        is_phone_order: true,
      },
      email_confirm: false,
    })

    if (authError) {
      console.error('❌ Auth error:', authError)

      // Si le quota est atteint, retourne une erreur 429
      if (authError.message?.includes('Quota exceeded')) {
        return new Response(
          JSON.stringify({ error: 'Quota exceeded, please try later', details: authError }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Auth error', details: authError }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('👤 Auth user created:', authUser.user.id)

    // Insertion dans la table 'users'
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: tempEmail,
        full_name: full_name,
        phone: phone,
        role: 'customer',
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ User profile insert error:', userError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: userError }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('✅ User profile created successfully')

    return new Response(
      JSON.stringify({ success: true, user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ General error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', message: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
