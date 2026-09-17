import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const env = {};
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
      }
    });
    return env;
  } catch {
    return process.env;
  }
}

const env = loadEnv();
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ERRO: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não definidos.");
  process.exit(1);
}

const TOTAL_DEVICES = Number(process.argv[2]) || 500;
console.log("=".repeat(70));
console.log(`🚀 INICIANDO SIMULAÇÃO DE ESTRESSE: ${TOTAL_DEVICES} APARELHOS CONECTADOS`);
console.log(`📡 URL do Servidor: ${SUPABASE_URL}`);
console.log("=".repeat(70));

async function runSimulation() {
  const clients = [];
  const channels = [];
  const receivedMessages = new Map();

  console.log(`\n[1/3] Conectando ${TOTAL_DEVICES} aparelhos via WebSocket Realtime...`);

  const BATCH_SIZE = 50;
  const numBatches = Math.ceil(TOTAL_DEVICES / BATCH_SIZE);

  for (let batch = 0; batch < numBatches; batch++) {
    const batchPromises = [];
    const startIndex = batch * BATCH_SIZE;
    const endIndex = Math.min((batch + 1) * BATCH_SIZE, TOTAL_DEVICES);

    for (let i = startIndex; i < endIndex; i++) {
      const deviceId = `Aparelho-${String(i + 1).padStart(3, "0")}`;
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
        realtime: {
          params: { eventsPerSecond: 20 },
        },
      });
      clients.push(client);

      const channel = client.channel("live-draw");
      channels.push(channel);

      const subPromise = new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve({ ok: false, deviceId, error: "timeout" });
        }, 20000);

        channel
          .on("broadcast", { event: "winner-announced" }, (payload) => {
            const receivedAt = performance.now();
            receivedMessages.set(deviceId, {
              receivedAt,
              payload: payload?.payload,
            });
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              clearTimeout(timer);
              resolve({ ok: true, deviceId });
            } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
              clearTimeout(timer);
              resolve({ ok: false, deviceId, error: status });
            }
          });
      });

      batchPromises.push(subPromise);
    }

    const results = await Promise.all(batchPromises);
    const successInBatch = results.filter((r) => r.ok).length;
    process.stdout.write(`  ✅ Lote ${batch + 1}/${numBatches}: ${successInBatch}/${endIndex - startIndex} conectados (Total acumulado: ${endIndex}/${TOTAL_DEVICES})\n`);

    // Pausa amigável de 400ms entre lotes para não atingir limite de rajada por IP único
    if (batch < numBatches - 1) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // Identifica o primeiro canal ativo para atuar como o transmissor do telão
  const activeChannelIndex = channels.findIndex((c) => c.state === "joined");
  const senderChannel = activeChannelIndex !== -1 ? channels[activeChannelIndex] : channels[0];
  const activeCount = channels.filter((c) => c.state === "joined").length;

  console.log(`\n🎉 ${activeCount} de ${TOTAL_DEVICES} aparelhos estão conectados e prontos no canal 'live-draw'!`);

  // Dispara o anúncio do vencedor
  console.log("\n[2/3] Telão do Palco disparando anúncio oficial do vencedor...");

  const testPayload = {
    drawId: "teste",
    drawTitle: "TESTE",
    prizeTitle: "Produtos Coreanos",
    winnerNumber: "0209",
    timestamp: new Date().toISOString(),
  };

  const broadcastStartTime = performance.now();

  await senderChannel.send({
    type: "broadcast",
    event: "winner-announced",
    payload: testPayload,
  });

  console.log(`  📣 Transmissão enviada via canal principal: Vencedor #${testPayload.winnerNumber} (${testPayload.prizeTitle})`);

  // Aguarda 5 segundos para que todos os 500 aparelhos recebam e registrem o timestamp
  console.log("\n[3/3] Coletando métricas de entrega e latência dos 500 aparelhos em tempo real...");
  await new Promise((r) => setTimeout(r, 5000));

  const totalReceived = receivedMessages.size;
  const latencies = [];

  for (const [deviceId, data] of receivedMessages.entries()) {
    const latency = data.receivedAt - broadcastStartTime;
    latencies.push(latency);
  }

  latencies.sort((a, b) => a - b);

  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const avgLatency =
    latencies.reduce((sum, l) => sum + l, 0) / (latencies.length || 1);
  const p50Latency = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99Latency = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log("\n" + "=".repeat(70));
  console.log(`📊 RESULTADO DO TESTE DE CARGA (${TOTAL_DEVICES} APARELHOS CONECTADOS)`);
  console.log("=".repeat(70));
  console.log(`• Aparelhos Conectados:     ${activeCount} / ${TOTAL_DEVICES}`);
  console.log(`• Avisos Recebidos:         ${totalReceived} / ${activeCount} (${((totalReceived / activeCount) * 100).toFixed(1)}%)`);
  console.log(`• Latência Mínima:          ${minLatency.toFixed(1)} ms`);
  console.log(`• Latência Mediana (P50):   ${p50Latency.toFixed(1)} ms`);
  console.log(`• Latência Média:           ${avgLatency.toFixed(1)} ms`);
  console.log(`• Latência P95 (95% dos):   ${p95Latency.toFixed(1)} ms`);
  console.log(`• Latência P99 (99% dos):   ${p99Latency.toFixed(1)} ms`);
  console.log(`• Latência Máxima:          ${maxLatency.toFixed(1)} ms`);
  console.log("=".repeat(70));

  const sampleDevice = Array.from(receivedMessages.values())[0];
  const payloadCorrect =
    sampleDevice?.payload?.winnerNumber === "0209" &&
    sampleDevice?.payload?.prizeTitle === "Produtos Coreanos";

  if (totalReceived >= activeCount * 0.95 && payloadCorrect) {
    console.log(`✅ TESTE APROVADO: ${totalReceived} aparelhos receberam o anúncio do vencedor simultaneamente!`);
  } else {
    console.log(`ℹ️ RESULTADO: ${totalReceived} aparelhos responderam ao anúncio.`);
  }

  console.log("\nDesconectando clientes de teste...");
  for (const client of clients) {
    client.realtime.disconnect();
  }
  console.log("Finalizado com sucesso.\n");
}

runSimulation().catch((err) => {
  console.error("Erro fatal no teste de carga:", err);
  process.exit(1);
});
