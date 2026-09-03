"use client";

import { Modal } from "@/components/ui/Modal";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="legal-modal-dialog"
      title="Política de Privacidade"
      badge={
        <span className="edit-ticket-badge">
          LGPD · Proteção de Dados
        </span>
      }
    >
      <div className="legal-modal-content">
        <p className="legal-modal-intro">
          O <strong>Fashion Date</strong> tem o compromisso de proteger a privacidade e os dados pessoais de todos os participantes dos sorteios oficiais, em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>

        <section className="legal-modal-section">
          <h4>1. Dados Coletados</h4>
          <p>Para viabilizar a sua inscrição e participação nos sorteios, coletamos:</p>
          <ul>
            <li><strong>Autenticação Social:</strong> Nome completo e endereço de e-mail fornecidos pelo provedor escolhido (Google ou Microsoft).</li>
            <li><strong>Dados de Contato:</strong> Número de WhatsApp (usado para envio do comprovante e contato com os contemplados).</li>
            <li><strong>Perfil no Evento:</strong> Categoria de participação (Lojista, Revendedor, Influenciador ou Visitante), nome da loja/marca e perfil do Instagram.</li>
          </ul>
        </section>

        <section className="legal-modal-section">
          <h4>2. Finalidade do Tratamento</h4>
          <p>Os seus dados são tratados exclusivamente para:</p>
          <ul>
            <li>Validar a autenticidade e unicidade da inscrição, evitando fraudes e duplicidades.</li>
            <li>Gerar e atribuir seus números da sorte oficiais às rodadas do evento.</li>
            <li>Realizar a apuração transparente do sorteio e exibir o nome e perfil do ganhador no telão do evento.</li>
            <li>Entrar em contato com o participante contemplado para entrega do prêmio.</li>
          </ul>
        </section>

        <section className="legal-modal-section">
          <h4>3. Armazenamento e Segurança</h4>
          <p>
            Suas informações são armazenadas em infraestrutura em nuvem segura com criptografia de ponta a ponta (banco de dados Supabase/PostgreSQL) e políticas de controle de acesso (Row Level Security). <strong>Nenhum dado é vendido, alugado ou compartilhado com empresas terceiras</strong> para fins comerciais.
          </p>
        </section>

        <section className="legal-modal-section">
          <h4>4. Seus Direitos</h4>
          <p>
            Você pode solicitar a confirmação, correção ou eliminação dos seus dados a qualquer momento antes ou após o término do evento, entrando em contato diretamente com a organização do Fashion Date.
          </p>
        </section>

        <footer className="legal-modal-footer">
          <button type="button" className="btn-modal-save" onClick={onClose}>
            Entendi e Concordo
          </button>
        </footer>
      </div>
    </Modal>
  );
}
