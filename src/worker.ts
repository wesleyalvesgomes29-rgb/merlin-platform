export interface Env {
  GEMINI_API_KEY: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Função auxiliar resiliente com fallback de modelos e timeout
async function generateWithFallbackAndTimeout(
  apiKey: string,
  userPrompt: string,
  systemPrompt: string,
  temperature: number
): Promise<string> {
  const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[Cloudflare Worker] Tentando gerar conteúdo usando modelo: ${model}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "aistudio-build",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: temperature
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json() as any;
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`[Cloudflare Worker] Conteúdo gerado com sucesso pelo modelo: ${model}`);
        return data.candidates[0].content.parts[0].text;
      }
      
      if (data.error) {
        throw new Error(`Erro da API Gemini: ${data.error.message || JSON.stringify(data.error)}`);
      }

      throw new Error(`O modelo ${model} retornou uma resposta em formato inesperado.`);
    } catch (error: any) {
      const msg = error.name === "AbortError" 
        ? `Timeout de 20 segundos atingido para o modelo ${model}.` 
        : (error.message || error);
      console.error(`[Cloudflare Worker] Falha ao gerar com modelo ${model}:`, msg);
      lastError = new Error(msg);
    }
  }

  throw lastError || new Error("Falha ao gerar conteúdo com todos os modelos disponíveis.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Tratar requisição OPTIONS para CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Roteamento
    if (path === "/api/gemini/generate-message") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Método não permitido" }), {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      try {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "A variável de ambiente GEMINI_API_KEY não está configurada no Cloudflare Worker." }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const body: any = await request.json();
        const { clientName, clientInterest, clientNotes, goal, clientStatus } = body;

        if (!clientName) {
          return new Response(
            JSON.stringify({ error: "O nome do cliente é obrigatório." }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const systemPrompt = `Você é o Merlin, um assistente virtual e especialista em copywriting para corretores de imóveis de alto desempenho.
Seu objetivo é criar mensagens de abordagem curtas, humanas, extremamente persuasivas e amigáveis para envio via WhatsApp ou Email.
Evite textos excessivamente formais, robóticos, artificiais ou repletos de jargões técnicos. Seja simpático, natural, direto ao ponto e focado em gerar conexão. Use quebras de linha e emojis com moderação para tornar a leitura agradável.`;

        const userPrompt = `Crie um script personalizado de abordagem rápida para o seguinte cliente:
- Nome do Cliente: ${clientName}
- Empreendimento de Interesse: ${clientInterest || "Não especificado ainda"}
- Perfil/Notas do Cliente: ${clientNotes || "Sem observações adicionais"}
- Etapa atual do Funil: ${clientStatus || "Lead Novo"}
- Objetivo da mensagem: ${goal || "Fazer um contato inicial para entender as necessidades"}

Instruções Adicionais:
- Escreva a mensagem em português do Brasil.
- A mensagem deve parecer escrita manualmente por um corretor de imóveis real (humanizado, amigável).
- Use o nome do cliente no início de forma natural.
- Tenha um gancho de chamada para ação claro (Call to Action), convidando para uma resposta simples ou um agendamento rápido de conversa.
- Retorne APENAS a mensagem pronta, sem introduções ou explicações.`;

        const text = await generateWithFallbackAndTimeout(apiKey, userPrompt, systemPrompt, 0.7);

        return new Response(JSON.stringify({ text }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (error: any) {
        console.error("Erro no Worker generate-message:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Erro interno ao gerar mensagem." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    if (path === "/api/gemini/analyze-leads") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Método não permitido" }), {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      try {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "A variável de ambiente GEMINI_API_KEY não está configurada no Cloudflare Worker." }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const body: any = await request.json();
        const { clientsSummary, salesCount, totalCommission } = body;

        const summary = clientsSummary || {
          totalCount: 0,
          noNextContactCount: 0,
          staleCount: 0,
          stageCounts: {}
        };

        const sales = salesCount !== undefined ? salesCount : 0;
        const commission = totalCommission !== undefined ? totalCommission : 0;

        const systemPrompt = `Você é o Merlin, um consultor estratégico e mentor de vendas de imóveis por inteligência artificial.
Seu papel é analisar a base de dados de leads de um corretor de imóveis e sugerir 3 recomendações táticas urgentes e extremamente acionáveis para aumentar as vendas e evitar perda de oportunidades.`;

        const userPrompt = `Analise a seguinte situação da base de leads do corretor:
- Total de Leads Cadastrados: ${summary.totalCount}
- Distribuição de Leads por Etapa do Funil:
${JSON.stringify(summary.stageCounts, null, 2)}
- Quantidade de Vendas Fechadas e Comissões: ${sales} vendas, com comissão total acumulada de R$ ${commission.toLocaleString("pt-BR")}
- Alertas e Gargalos Detectados:
  * Leads sem data de retorno agendada: ${summary.noNextContactCount}
  * Leads "frios/estagnados" sem contato há mais de 15 dias: ${summary.staleCount}

Com base nestes dados, gere exatamente 3 recomendações táticas bem estruturadas e práticas em português.
Seja direto, motivador e focado em resultados rápidos. Retorne a resposta em formato Markdown limpo, estruturado com títulos claros para cada recomendação.`;

        const text = await generateWithFallbackAndTimeout(apiKey, userPrompt, systemPrompt, 0.75);

        return new Response(JSON.stringify({ text }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (error: any) {
        console.error("Erro no Worker analyze-leads:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Erro interno ao analisar leads." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Para qualquer outra requisição, como o Cloudflare Worker moderno (wrangler v3 com assets)
    // servirá os arquivos estáticos da pasta dist automaticamente a partir da configuração wrangler.toml,
    // retornamos 404 apenas caso não encontre nenhum arquivo estático correspondente.
    return new Response("Not Found", { status: 404 });
  }
};
