import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Debes especificar start y end en formato YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    const response = await analyticsData.properties.runReport({
      property: propertyId,
      requestBody: {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: "activeUsers" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
    });

    const rows = response.data.rows ?? [];

    // Función para formatear YYYYMMDD -> "07 Ago"
    const formatDateLabel = (rawDate: string): string => {
      if (!rawDate || rawDate.length !== 8) return rawDate;
      const year = parseInt(rawDate.slice(0, 4));
      const month = parseInt(rawDate.slice(4, 6)) - 1;
      const day = parseInt(rawDate.slice(6, 8));

      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
      }).format(date);
    };

    // Mapear datos ya formateados
    const formattedRows = rows.map((row) => ({
      dimensionValues: [
        {
          value: formatDateLabel(row.dimensionValues?.[0].value ?? ""),
        },
      ],
      metricValues: row.metricValues ?? [],
    }));

    return NextResponse.json({ rows: formattedRows });
  } catch (err) {
    console.error("Error detallado GA4:", JSON.stringify(err, null, 2));
    return NextResponse.json(
      { error: (err as Error).message || "Error al conectar con Google Analytics" },
      { status: 500 }
    );
  }
}

