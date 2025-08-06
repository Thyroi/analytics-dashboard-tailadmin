import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const propertyId = process.env.GA_PROPERTY_ID;

    if (!clientEmail || !privateKey || !propertyId) {
      return NextResponse.json(
        { error: "Faltan credenciales o Property ID de Google Analytics" },
        { status: 500 }
      );
    }

    // Autenticación con Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata({
      version: "v1beta",
      auth,
    });

    // Consulta últimos 30 días
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
        metrics: [{ name: "activeUsers" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
    });

    const rows = response.data.rows ?? [];

    // Convertir a estructura usable
    const allDays = rows.map((row) => {
      const dateStr = row.dimensionValues?.[0].value ?? "";
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const date = new Date(`${year}-${month}-${day}`);
      return {
        date,
        value: Number(row.metricValues?.[0].value ?? 0),
      };
    });

    // Filtrar los últimos 7 días con datos > 0
    const activeDays = allDays.filter((d) => d.value > 0);
    const last7Active = activeDays.slice(-7); // últimos 7 con visitas

    // Preparar categorías y valores
    const categories = last7Active.map((d) =>
      d.date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
    );
    const dataValues = last7Active.map((d) => d.value);

    return NextResponse.json({
      series: [{ name: "Usuarios activos", data: dataValues }],
      categories,
    });
  } catch (err) {
    console.error("Error detallado GA4:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      {
        error:
          (err as Error).message || "Error al conectar con Google Analytics",
      },
      { status: 500 }
    );
  }
}
