import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const propertyId = process.env.GA_PROPERTY_ID;

    // Validación de variables
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

    // Consulta a GA4
    const response = await analyticsData.properties.runReport({
      property: process.env.GA_PROPERTY_ID as string,
      requestBody: {
        dateRanges: [
          { startDate: "30daysAgo", endDate: "today", name: "current" },
          { startDate: "60daysAgo", endDate: "31daysAgo", name: "previous" },
        ],
        metrics: [{ name: "activeUsers" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
    });

    // Tipado local de filas
    type GAReportRow = {
      dimensionValues: { value: string }[];
      metricValues: { value: string }[];
    };

    // Normalizamos filas para evitar undefined
    const rows: GAReportRow[] =
      response.data.rows?.map((row) => ({
        dimensionValues:
          row.dimensionValues?.map((d) => ({ value: d.value ?? "" })) ?? [],
        metricValues:
          row.metricValues?.map((m) => ({ value: m.value ?? "" })) ?? [],
      })) ?? [];

    // Devolvemos los datos
    return NextResponse.json({
      dimensionHeaders: response.data.dimensionHeaders,
      metricHeaders: response.data.metricHeaders,
      rows,
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
