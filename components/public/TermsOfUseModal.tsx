"use client";

import { Modal } from "@/components/ui/Modal";

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfUseModal({ isOpen, onClose }: TermsOfUseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="legal-modal-dialog"
      title="Termos de Uso e Regulamento"
      badge={
        <span className="edit-ticket-badge">
          Regulamento Oficial · 2026
        </span>
      }
    >
      <div className="legal-modal-content">
        <p className="legal-modal-intro">
          Bem-vindo ao sistema oficial de sorteios do <strong>Fashion Date</strong>. Ao participar, você declara ter lido, compreendido e aceitado os termos e condições deste regulamento.
        </p>

        <section className="legal-modal-section">
          <h4>1. Elegibilidade e Inscrição</h4>
          <ul>
            <li>A participação é gratuita e destinada aos participantes presentes no evento Fashion Date.</li>
            <li>Para garantir a legitimidade da rodada, é obrigatório conectar-se via conta Google ou Microsoft válida.</li>
            <li>Cada participante tem direito a um único cadastro ativo por CPF/WhatsApp. Cadastros com informações inverídicas ou duplicadas serão desclassificados.</li>
          </ul>
        </section>

        <section className="legal-modal-section">
          <h4>2. Atribuição de Números da Sorte</h4>
          <ul>
            <li>Após a conclusão do cadastro, o sistema gera automaticamente os números da sorte vinculados ao perfil do participante.</li>
            <li>Determinadas rodadas de sorteio podem ter regras específicas para categorias (ex: rodada exclusiva para Lojistas ou Revendedores), respeitando os parâmetros configurados pela organização.</li>
          </ul>
        </section>

        <section className="legal-modal-section">
          <h4>3. Apuração e Entrega dos Prêmios</h4>
          <ul>
            <li>Os sorteios serão realizados de forma eletrônica e transparente no telão oficial do evento.</li>
            <li>O contemplado deve atender aos requisitos da rodada sorteada e estar apto a comprovar sua identidade perante a organização.</li>
            <li>Os prêmios são pessoais e intransferíveis, não podendo ser convertidos em dinheiro ou trocados por outros produtos.</li>
          </ul>
        </section>

        <section className="legal-modal-section">
          <h4>4. Uso de Imagem e Menção Oficial</h4>
          <p>
            Os participantes contemplados autorizam, a título gratuito, o uso de seu nome, foto e perfil do Instagram nos canais oficiais de comunicação, redes sociais e transmissões do Fashion Date exclusivamente para a divulgação dos resultados do evento.
          </p>
        </section>

        <footer className="legal-modal-footer">
          <button type="button" className="btn-modal-save" onClick={onClose}>
            Li e Concordo com os Termos
          </button>
        </footer>
      </div>
    </Modal>
  );
}
