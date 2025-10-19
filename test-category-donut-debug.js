/**
 * Test específico para debugear el problema de donut vacía en categorías
 * Simula llamadas a la API para verificar qué datos se retornan
 */

const fetch = require("node-fetch");

async function testCategoryDonutData() {
  console.log("🔍 INICIANDO TEST DE DEBUG PARA DONUT DE CATEGORÍAS");

  const baseUrl = "http://localhost:3000";
  const categoryId = "naturaleza";
  const granularity = "d";

  try {
    // 1. Test GA4 API directamente
    console.log("\n📊 Testing GA4 API...");
    const ga4Url = `${baseUrl}/api/analytics/v1/dimensions/categorias/details/${categoryId}?g=${granularity}`;
    console.log("GA4 URL:", ga4Url);

    const ga4Response = await fetch(ga4Url);

    if (!ga4Response.ok) {
      console.error(
        "❌ GA4 API Error:",
        ga4Response.status,
        ga4Response.statusText
      );
      return;
    }

    const ga4Data = await ga4Response.json();
    console.log("✅ GA4 Response Structure:", {
      hasDonutData: !!ga4Data.donutData,
      donutDataLength: ga4Data.donutData?.length || 0,
      donutDataSample: ga4Data.donutData?.slice(0, 3) || [],
      hasSeries: !!ga4Data.series,
      currentSeriesLength: ga4Data.series?.current?.length || 0,
      previousSeriesLength: ga4Data.series?.previous?.length || 0,
      debug: ga4Data.debug,
    });

    // 2. Test Chatbot API directamente
    console.log("\n🤖 Testing Chatbot API...");
    const chatbotUrl = `${baseUrl}/api/chatbot/totals`;

    const chatbotResponse = await fetch(chatbotUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        granularity,
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      }),
    });

    if (!chatbotResponse.ok) {
      console.error(
        "❌ Chatbot API Error:",
        chatbotResponse.status,
        chatbotResponse.statusText
      );
      return;
    }

    const chatbotData = await chatbotResponse.json();
    console.log("✅ Chatbot Response Structure:", {
      hasOutput: !!chatbotData.output,
      outputKeys: chatbotData.output
        ? Object.keys(chatbotData.output).length
        : 0,
      naturalezaKeys: chatbotData.output
        ? Object.keys(chatbotData.output).filter((key) =>
            key.toLowerCase().includes("naturaleza")
          )
        : [],
      sampleEntry: chatbotData.output
        ? Object.entries(chatbotData.output)[0]
        : null,
    });

    // 3. Análisis de combinación
    console.log("\n🔀 Análisis de Combinación:");

    const hasGA4Donut = ga4Data.donutData && ga4Data.donutData.length > 0;
    const hasChatbotData =
      chatbotData.output && Object.keys(chatbotData.output).length > 0;

    console.log({
      hasGA4Donut,
      hasChatbotData,
      expectedBehavior:
        "Si GA4 tiene donut data O chatbot tiene data, la donut debe renderizarse",
      actualProblem: "Donut aparece vacía a pesar de tener delta del 567%",
    });

    // 4. Test del buildSeriesAndDonutFocused simulado
    if (hasChatbotData) {
      console.log("\n🛠️ Simulando buildSeriesAndDonutFocused...");

      const naturalezaEntries = Object.entries(chatbotData.output).filter(
        ([path]) => path.toLowerCase().includes("naturaleza")
      );

      console.log("Naturaleza entries found:", naturalezaEntries.length);
      naturalezaEntries.forEach(([path, entries]) => {
        console.log(`Path: ${path}, Entries:`, entries.length);
      });
    }
  } catch (error) {
    console.error("❌ Test Error:", error.message);
  }
}

// Ejecutar el test
if (require.main === module) {
  testCategoryDonutData();
}

module.exports = { testCategoryDonutData };
