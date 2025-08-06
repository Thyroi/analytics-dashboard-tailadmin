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

    // Autenticación con Google Service Account
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

    // Consulta datos por mes (últimos 12 meses)
    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate: "365daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
        dimensions: [{ name: "yearMonth" }], // Agrupado por mes
        orderBys: [{ dimension: { dimensionName: "yearMonth" } }],
      },
    });

    // Transformar datos al formato de la gráfica
    const rows = response.data.rows ?? [];

    const categories = rows.map((row) => {
      const ym = row.dimensionValues?.[0].value || "";
      const year = ym.substring(0, 4);
      const month = ym.substring(4, 6);
      const date = new Date(`${year}-${month}-01`);
      return date.toLocaleString("es-ES", { month: "short" }); // Ej: "ene", "feb"
    });

    const dataValues = rows.map((row) =>
      Number(row.metricValues?.[0].value ?? 0)
    );

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
