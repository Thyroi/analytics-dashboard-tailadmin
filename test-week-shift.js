// Test para verificar el desplazamiento temporal de la granularidad "semana"

// Simulando las funciones principales de datetime
function parseISO(dateStr) {
  return new Date(dateStr + "T00:00:00.000Z");
}

function toISO(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysUTC(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function todayUTC() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

// Función para crear un rango de semana terminando ayer
function deriveRangeEndingYesterday(granularity, now = todayUTC()) {
  const yesterday = addDaysUTC(now, -1);

  if (granularity === "w") {
    const start = addDaysUTC(yesterday, -(7 - 1)); // 6 días hacia atrás
    return { start: toISO(start), end: toISO(yesterday) };
  }

  return { start: toISO(yesterday), end: toISO(yesterday) };
}

// Función de desplazamiento para rango previo
function shiftPrevRange(current, granularity) {
  const currentStart = parseISO(current.start);
  const currentEnd = parseISO(current.end);

  // Para granularidad semanal: desplazamiento de 7 días
  const shiftDays = granularity === "w" ? 7 : 1;

  return {
    start: toISO(addDaysUTC(currentStart, -shiftDays)),
    end: toISO(addDaysUTC(currentEnd, -shiftDays)),
  };
}

// Función principal que simula computeRangesFromQuery para granularidad "w"
function computeRangesFromQuery(granularity, startQ, endQ) {
  console.log(`\n=== TESTING GRANULARITY: ${granularity} ===`);
  console.log(`startQ: ${startQ}, endQ: ${endQ}`);

  if (startQ && endQ) {
    console.log("Caso: rango personalizado");
    const current = { start: startQ, end: endQ };
    const previous = shiftPrevRange(current, granularity);

    console.log("CURRENT:", current);
    console.log("PREVIOUS:", previous);

    return { current, previous };
  }

  if (endQ) {
    console.log("Caso: preset terminando en endQ");
    const base = parseISO(endQ);

    // Para granularidad semanal: 7 días hacia atrás
    const start = addDaysUTC(base, -(7 - 1));
    const current = { start: toISO(start), end: toISO(base) };
    const previous = shiftPrevRange(current, granularity);

    console.log("CURRENT:", current);
    console.log("PREVIOUS:", previous);

    return { current, previous };
  }

  console.log("Caso: preset terminando ayer");
  const current = deriveRangeEndingYesterday(granularity);
  const previous = shiftPrevRange(current, granularity);

  console.log("CURRENT:", current);
  console.log("PREVIOUS:", previous);

  return { current, previous };
}

// TESTS
console.log("Fecha actual:", toISO(todayUTC()));

// Test 1: Sin parámetros (preset terminando ayer)
computeRangesFromQuery("w");

// Test 2: Solo endDate
computeRangesFromQuery("w", null, "2024-10-10");

// Test 3: Rango personalizado
computeRangesFromQuery("w", "2024-10-01", "2024-10-07");

// Test 4: Comparar con granularidad diaria
computeRangesFromQuery("d", null, "2024-10-10");

// Test adicional: Visualizar la diferencia entre rangos actuales y previos
console.log("\n=== ANÁLISIS DE OVERLAPPING ===");

function analyzeDifference(current, previous) {
  const currentStart = parseISO(current.start);
  const currentEnd = parseISO(current.end);
  const previousStart = parseISO(previous.start);
  const previousEnd = parseISO(previous.end);

  const currentDays =
    Math.round((currentEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1;
  const previousDays =
    Math.round((previousEnd - previousStart) / (1000 * 60 * 60 * 24)) + 1;
  const shiftAmount = Math.round(
    (currentStart - previousStart) / (1000 * 60 * 60 * 24)
  );

  console.log(`Duración del rango actual: ${currentDays} días`);
  console.log(`Duración del rango previo: ${previousDays} días`);
  console.log(`Desplazamiento aplicado: ${shiftAmount} días`);

  // Calcular overlap
  const overlapStart = Math.max(
    currentStart.getTime(),
    previousStart.getTime()
  );
  const overlapEnd = Math.min(currentEnd.getTime(), previousEnd.getTime());

  if (overlapStart <= overlapEnd) {
    const overlapDays =
      Math.round((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
    console.log(`⚠️ OVERLAP: ${overlapDays} días se solapan entre rangos`);
    console.log(
      `   Desde: ${toISO(new Date(overlapStart))} hasta: ${toISO(
        new Date(overlapEnd)
      )}`
    );
  } else {
    console.log(`✅ NO HAY OVERLAP entre rangos`);
  }
}

const weeklyTest = computeRangesFromQuery("w", null, "2024-10-10");
analyzeDifference(weeklyTest.current, weeklyTest.previous);
