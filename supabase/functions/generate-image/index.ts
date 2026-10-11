import { storageReference } from "../_shared/storage-path.ts";
import { appendImageReferences } from "../_shared/image-references.ts";
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
  fotoOriginalPath?: string | null;
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
    id: string;
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

    // User-scoped queries validate ownership before any service-role upload.
    const { data: peca, error: pecaError } = await supabaseAnon.from("pecas").select("*").eq("id", body.pecaId).eq("user_id", user.id).single();
    const { data: geracao, error: geracaoError } = await supabaseAnon.from("geracoes").select("*").eq("id", body.geracaoId).eq("peca_id", body.pecaId).eq("user_id", user.id).single();
    if (pecaError || geracaoError || !peca || !geracao || geracao.status !== "processando" || geracao.tipo_geracao !== body.tipoGeracao) {
      return new Response(JSON.stringify({ error: "Peça ou geração não autorizada." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const originalRef = storageReference(peca.foto_original_path, "pecas-fotos", supabaseUrl)
      ?? storageReference(peca.foto_original_url, "pecas-fotos", supabaseUrl);
    if (!originalRef || originalRef.bucket !== "pecas-fotos") throw new Error("Fotografia original sem caminho válido no Storage.");
    let modeloRef: ReturnType<typeof storageReference> = null;
    if (body.tipoGeracao === "modelo") {
      const { data: modelo, error } = await supabaseAnon.from("modelos").select("*").eq("id", geracao.modelo_id).single();
      if (error || !modelo) throw new Error("Modelo não autorizado ou inexistente.");
      body.modelo = { ...modelo, id: modelo.id };
      modeloRef = storageReference(modelo.retrato_path, "modelos-referencias", supabaseUrl)
        ?? storageReference(modelo.retrato_url, "modelos-referencias", supabaseUrl);
      if (!modeloRef || modeloRef.bucket !== "modelos-referencias") throw new Error("Modelo sem caminho de retrato válido.");
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

    const { data: fotoBlob, error: fotoError } = await supabaseAnon.storage.from(originalRef.bucket).download(originalRef.path);
    if (fotoError || !fotoBlob) throw new Error(`Erro ao carregar original: ${fotoError?.message}`);
    const fotoFile = new File([fotoBlob], "original.jpg", { type: fotoBlob.type || "image/jpeg" });
    let modeloFile: File | null = null;
    if (modeloRef) {
      const { data: retrato, error } = await supabaseAnon.storage.from(modeloRef.bucket).download(modeloRef.path);
      if (error || !retrato) throw new Error(`Erro ao carregar retrato: ${error?.message}`);
      modeloFile = new File([retrato], "modelo.jpg", { type: retrato.type || "image/jpeg" });
    }

    // Call OpenAI Images API (edit endpoint with reference images)
    const formData = new FormData();
    formData.append("model", imageModel);
    formData.append("prompt", prompt);
    appendImageReferences(formData, fotoFile, modeloFile);
    formData.append("n", "1");
    formData.append("size", "1024x1024");

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
      if (!imgResp.ok) throw new Error("Falha ao recuperar imagem gerada.");
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
      .from("geracoes-imagens")
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

    // Persist the permanent path server-side before returning to the browser.
    const { error: saveError } = await supabaseAnon.from("geracoes").update({
      status: "concluida", imagem_path: storagePath, imagem_url: null,
      prompt_usado: prompt, modelo_ia: imageModel, erro_mensagem: null,
    }).eq("id", geracao.id).eq("user_id", user.id);
    if (saveError) throw new Error(`Imagem armazenada em ${storagePath}, mas falhou o registro: ${saveError.message}`);
    const { data: signedUrlData } = await supabaseAnon.storage.from("geracoes-imagens").createSignedUrl(storagePath, 3600);
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
