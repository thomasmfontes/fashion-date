const participants = [
  { name: "Maria Clara Santos", store: "Boutique Elegance", phone: "11987654321", instagram: "@boutiqueelegance" },
  { name: "Juliana Paes Ribeiro", store: "Bella Donna Modas", phone: "11998871122", instagram: "@belladonnamodas" },
  { name: "Camila Vasconcelos", store: "Closet Chic Boutique", phone: "21976543210", instagram: "@closetchicoficial" },
  { name: "Patrícia Alencar", store: "Requinte & Estilo", phone: "31988776655", instagram: "@requinteestiloloja" },
  { name: "Beatriz Medeiros", store: "Flor de Lis Conceito", phone: "41991234567", instagram: "@flordelisconceito" },
  { name: "Larissa Fernandes", store: "Ateliê Renata Moda", phone: "71982345678", instagram: "@atelierenatamoda" },
  { name: "Mariana Albuquerque", store: "Fascínio Fashion", phone: "81993456789", instagram: "@fasciniofashion" },
  { name: "Fernanda Guimarães", store: "Donna Bella Vestuário", phone: "85984567890", instagram: "@donnabellavestuario" },
  { name: "Amanda Siqueira", store: "Maison D'Or", phone: "61995678901", instagram: "@maisondor.loja" },
  { name: "Renata Castelli", store: "Pura Graça Modas", phone: "19986789012", instagram: "@puragracamodas" },
  { name: "Luciana Prado", store: "Studio Mulher Elegante", phone: "16997890123", instagram: "@studiomulherelegante" },
  { name: "Gabriela Toledo", store: "Divina Rosa Closet", phone: "47988901234", instagram: "@divinarosacloset" },
  { name: "Rafaela Duarte", store: "Pérola Rara Conceito", phone: "51999012345", instagram: "@perolararaconceito" },
  { name: "Vanessa Meireles", store: "Encanto & Charme", phone: "27981123456", instagram: "@encantoecharmestore" },
  { name: "Débora Nogueira", store: "Sublime Moda Evangélica", phone: "62992234567", instagram: "@sublimemodaevangelica" },
  { name: "Aline Rezende", store: "Estilo Real Boutique", phone: "67983345678", instagram: "@estilorealboutique" },
  { name: "Bruna Peixoto", store: "Vitrine Fashion Date", phone: "98994456789", instagram: "@vitrinefashiondate" },
  { name: "Jéssica Santana", store: "Lumina Closet", phone: "84985567890", instagram: "@luminacloset.oficial" },
  { name: "Priscila Brandão", store: "Chic & Graciosa", phone: "86996678901", instagram: "@chicegraciosa" },
  { name: "Thaís Camargo", store: "Doce Encanto Modas", phone: "82987789012", instagram: "@doceencantomodas" },
  { name: "Tatiane Farias", store: "Essência Feminina", phone: "79998890123", instagram: "@essenciafemininamoda" },
  { name: "Caroline Ramos", store: "Magnólia Boutique", phone: "92989901234", instagram: "@magnoliaboutique.br" },
  { name: "Isabela Fontes", store: "Rosa Chá Moda", phone: "91991012345", instagram: "@rosachamodafeminina" },
  { name: "Raquel Silveira", store: "Bella Luna Store", phone: "65982123456", instagram: "@bellalunastore.br" },
  { name: "Daniele Viana", store: "Glamour & Graça", phone: "63993234567", instagram: "@glamouregraça" },
];

async function seed() {
  let created = 0;
  for (const p of participants) {
    try {
      const res = await fetch("http://localhost:4173/api/participants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...p, consent: true }),
      });
      const data = await res.json();
      if (res.ok && data.participant) {
        created++;
        console.log(`✔ [${data.participant.luckyNumber}] ${data.participant.name} — ${data.participant.store}`);
      } else {
        console.error("Erro ao cadastrar:", p.name, data);
      }
    } catch (e) {
      console.error("Falha de rede:", p.name, e.message);
    }
  }
  console.log(`\n🎉 Total cadastrados com sucesso: ${created} participantes.`);
}

seed();
