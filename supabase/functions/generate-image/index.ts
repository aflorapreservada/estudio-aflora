import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  pecaId: string;
  geracaoId: string;
  tipoGeracao: "editorial" | "modelo";
  fotoOriginalUrl: string | null;
  pecaNome: string;
  pecaTipo: string;
  pecaDimensoes: string;
  pecaMaterial: string;
  cordao: string;
  cenario: string;
  instrucoes: string;
  gabarito: {
    posicao_x: number;
    posicao_y: number;
    escala: number;
    rotacao: number;
    nome: string;
  } | null;
  modelo: {
    nome: string;
    genero: string;
    descricao: string;
    tom_pele: string;
    retratoUrl: string | null;
  } | null;
}

function buildPromptEditorial(req: GenerateRequest): string {
  const parts: string[] = [];

  parts.push(
    `Professional editorial product photograph of a handmade bio-jewelry piece: ${req.pecaNome}.`
  );

  if (req.pecaTipo) parts.push(`Type: ${req.pecaTipo}.`);
  if (req.pecaMaterial) parts.push(`Material: ${req.pecaMaterial}.`);
  if (req.pecaDimensoes) parts.push(`Dimensions: ${req.pecaDimensoes}.`);
  if (req.cordao) parts.push(`Cord: ${req.cordao}.`);

  parts.push(`Setting: ${req.cenario}.`);

  if (req.gabarito) {
    parts.push(
      `The piece should be positioned at ${req.gabarito.posicao_x}% horizontal, ${req.gabarito.posicao_y}% vertical of the frame, occupying approximately ${req.gabarito.escala}% of the frame, rotated ${req.gabarito.rotacao} degrees.`
    );
  }

  if (req.instrucoes) {
    parts.push(`Additional instructions: ${req.instrucoes}.`);
  }

  parts.push(
    "CRITICAL: Preserve the exact shape, color, texture, materials, and proportions of the original piece shown in the reference image. Do not invent new jewelry or alter the piece's design. High-end commercial photography quality, realistic lighting, sharp focus on the piece."
  );

  return parts.join(" ");
}

function buildPromptModelo(req: GenerateRequest): string {
  const parts: string[] = [];

  if (req.modelo) {
    parts.push(
      `Realistic photograph of a ${req.modelo.genero === "feminino" ? "woman" : "man"} named ${req.modelo.nome}.`
    );
    if (req.modelo.descricao) parts.push(`Appearance: ${req.modelo.descricao}.`);
    if (req.modelo.tom_pele) parts.push(`Skin tone: ${req.modelo.tom_pele}.`);
    parts.push(
      `Wearing the bio-jewelry piece: ${req.pecaNome}.`
    );
  }

  if (req.pecaTipo) parts.push(`Jewelry type: ${req.pecaTipo}.`);
  if (req.pecaMaterial) parts.push(`Material: ${req.pecaMaterial}.`);
  if (req.pecaDimensoes) parts.push(`Dimensions: ${req.pecaDimensoes}.`);
  if (req.cordao) parts.push(`Cord: ${req.cordao}.`);

  parts.push(`Setting: ${req.cenario}.`);

  if (req.gabarito) {
    parts.push(
      `The jewelry should be positioned at ${req.gabarito.posicao_x}% horizontal, ${req.gabarito.posicao_y}% vertical of the frame, occupying approximately ${req.gabarito.escala}% of the frame.`
    );
  }

  if (req.instrucoes) {
    parts.push(`Additional instructions: ${req.instrucoes}.`);
  }

  parts.push(
    "CRITICAL: Preserve the exact shape, color, texture, materials, and proportions of the original jewelry piece shown in the reference image. The model should wear the actual piece — do not invent new jewelry. Maintain the model's identity consistently. Realistic photography, natural lighting."
  );

  return parts.join(" ");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Verify the user's JWT
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: GenerateRequest = await req.json();

    // Validate required fields
    if (!body.pecaId || !body.geracaoId || !body.tipoGeracao) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.fotoOriginalUrl) {
      return new Response(
        JSON.stringify({ error: "Fotografia original é obrigatória." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.tipoGeracao === "modelo" && !body.modelo) {
      return new Response(
        JSON.stringify({ error: "Selecione um modelo para gerar a fotografia com modelo." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Chave da API OpenAI não configurada. Configure a variável OPENAI_API_KEY nas secrets da Edge Function.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine model to use (configurable)
    const imageModel = "gpt-image-1";

    // Build prompt
    const prompt =
      body.tipoGeracao === "editorial"
        ? buildPromptEditorial(body)
        : buildPromptModelo(body);

    // Fetch the original photo as a File for the API
    const fotoResponse = await fetch(body.fotoOriginalUrl);
    if (!fotoResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Não foi possível carregar a fotografia original." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const fotoBlob = await fotoResponse.blob();
    const fotoFile = new File([fotoBlob], "original.jpg", { type: fotoBlob.type || "image/jpeg" });

    // If modelo has a retrato, include it as a second reference
    let modeloFile: File | null = null;
    if (body.modelo?.retratoUrl) {
      try {
        const retratoResp = await fetch(body.modelo.retratoUrl);
        if (retratoResp.ok) {
          const retratoBlob = await retratoResp.blob();
          modeloFile = new File([retratoBlob], "modelo.jpg", { type: retratoBlob.type || "image/jpeg" });
        }
      } catch {
        // retrato is optional, continue without it
      }
    }

    // Call OpenAI Images API (edit endpoint with reference images)
    const formData = new FormData();
    formData.append("model", imageModel);
    formData.append("prompt", prompt);
    formData.append("image", fotoFile);
    formData.append("n", "1");
    formData.append("size", "1024x1024");

    if (modeloFile) {
      formData.append("image", modeloFile);
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      const errMsg =
        errorData?.error?.message ??
        `Erro da OpenAI (${openaiResponse.status})`;
      return new Response(
        JSON.stringify({ error: `Erro na geração de imagem: ${errMsg}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();

    if (!openaiData.data || openaiData.data.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma imagem foi retornada pela API." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageData = openaiData.data[0];

    // The API returns base64 or URL
    let imageBlob: Blob;
    let imageBase64: string | null = null;

    if (imageData.b64_json) {
      imageBase64 = imageData.b64_json;
      const binaryString = atob(imageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBlob = new Blob([bytes], { type: "image/png" });
    } else if (imageData.url) {
      const imgResp = await fetch(imageData.url);
      imageBlob = await imgResp.blob();
    } else {
      return new Response(
        JSON.stringify({ error: "Formato de resposta da OpenAI não suportado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload generated image to Supabase Storage
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const storagePath = `${user.id}/${body.pecaId}/${Date.now()}-gerada.png`;

    const { error: uploadError } = await supabaseService.storage
      .from("pecas-fotos")
      .upload(storagePath, imageBlob, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Erro ao salvar imagem: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create signed URL (1 year)
    const { data: signedUrlData } = await supabaseService.storage
      .from("pecas-fotos")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    const imageUrl = signedUrlData?.signedUrl ?? null;

    return new Response(
      JSON.stringify({
        success: true,
        imagemPath: storagePath,
        imagemUrl: imageUrl,
        prompt,
        modelo: imageModel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido.";
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
