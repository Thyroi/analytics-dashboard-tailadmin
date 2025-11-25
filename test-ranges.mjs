// Quick test to show exact ranges
import { buildLaggedAxisForGranularity } from "./src/lib/utils/time/timeAxis.js";

const endISO = "2024-11-23";
const axis = buildLaggedAxisForGranularity("d", { endISO });

console.log("\n📅 CUANDO LLAMAS DEL 17 AL 23 (endISO = 2024-11-23):");
console.log("═══════════════════════════════════════════════════\n");

console.log("📊 CURRENT PERIOD (lo que tú esperarías):");
console.log(`   ${axis.curRange.start} → ${axis.curRange.end}`);
console.log("   Días:", axis.curKeys.join(", "));

console.log("\n📊 PREVIOUS PERIOD (período anterior):");
console.log(`   ${axis.prevRange.start} → ${axis.prevRange.end}`);
console.log("   Días:", axis.prevKeys.join(", "));

console.log("\n🔍 QUERY A GA4 (rango único que se consulta):");
console.log(`   ${axis.queryRange.start} → ${axis.queryRange.end}`);

console.log("\n⚠️  FECHAS QUE SE SOLAPAN (aparecen en AMBOS períodos):");
const solapadas = [];
for (const curKey of axis.curKeys) {
  if (axis.prevIndexByKey.has(curKey)) {
    solapadas.push(curKey);
  }
}
console.log("   ", solapadas.join(", "));
console.log(`   Total: ${solapadas.length} de ${axis.curKeys.length} días`);

console.log("\n✅ RESPUESTA A TU PREGUNTA:");
console.log("   Si llamas del 17 al 23 (current)");
console.log("   Previous es: del 16 al 22");
console.log("   NO es del 10 al 16 ❌");
console.log("\n   Es un desplazamiento de SOLO 1 DÍA, no 7 días.\n");
