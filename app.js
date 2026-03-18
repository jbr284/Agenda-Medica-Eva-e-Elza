const firebaseConfig = {
  apiKey: "AIzaSyA_mJkkpL87mTlRkbPRxHuxObPE1PqqlgE",
  authDomain: "agenda-medica---eva-e-elza.firebaseapp.com",
  databaseURL: "https://agenda-medica---eva-e-elza-default-rtdb.firebaseio.com/",
  projectId: "agenda-medica---eva-e-elza",
  storageBucket: "agenda-medica---eva-e-elza.firebasestorage.app",
  messagingSenderId: "664880376825",
  appId: "1:664880376825:web:3a392e1da6ce2eedf12b28"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let agendamentoEmEdicao = null;
let modoAdmin = false; 
let dadosCache = null;

// === LÓGICA DE ACESSO ===

function entrarModoVisitante() {
    modoAdmin = false;
    iniciarApp();
}

function entrarModoAdmin() {
    const senhaDigitada = prompt("Digite a senha de administrador:");
    if (senhaDigitada === "1001") { 
        modoAdmin = true;
        iniciarApp();
    } else {
        alert("Senha incorreta!");
    }
}

function iniciarApp() {
    document.getElementById('tela-login').classList.add('hidden');
    document.getElementById('app-principal').classList.remove('hidden');

    if (modoAdmin) {
        document.getElementById('btn-tab-cadastro').classList.remove('hidden');
    } else {
        document.getElementById('btn-tab-cadastro').classList.add('hidden');
    }

    if (dadosCache) {
        renderizarLista(dadosCache);
    }
}

function sairDoApp() {
    document.getElementById('app-principal').classList.add('hidden');
    document.getElementById('tela-login').classList.remove('hidden');
    
    modoAdmin = false;
    document.querySelectorAll('.tab-content').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.btn-tab').forEach(btn => btn.classList.remove('active'));
}

// === LÓGICA DE ABAS ===
function toggleAba(nomeAba) {
  const abaDestino = document.getElementById(`tab-${nomeAba}`);
  const btnDestino = document.getElementById(`btn-tab-${nomeAba}`);
  
  if (abaDestino.classList.contains('active')) {
      abaDestino.classList.remove('active');
      btnDestino.classList.remove('active');
      return;
  }
  abrirAbaDireto(nomeAba);
}

function abrirAbaDireto(nomeAba) {
    document.querySelectorAll('.tab-content').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.btn-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${nomeAba}`).classList.add('active');
    document.getElementById(`btn-tab-${nomeAba}`).classList.add('active');
}

// === CRUD ===
function adicionarAgendamento() {
  if (!modoAdmin) return; 

  const btnSalvar = document.getElementById('btn-salvar');
  const textoOriginal = btnSalvar.innerText;
  btnSalvar.innerText = "Salvando...";
  btnSalvar.disabled = true;

  const data = document.getElementById('data-input').value; 
  const hora = document.getElementById('hora-input').value;
  const procedimento = document.getElementById('procedimento').value;
  const especialidade = document.getElementById('especialidade').value;
  const local = document.getElementById('local').value;
  const medico = document.getElementById('medico').value;
  const paciente = document.getElementById('paciente').value;
  
  if (!data || !hora || !procedimento || !paciente) {
    alert("Preencha Data, Hora, Paciente e Procedimento.");
    btnSalvar.innerText = textoOriginal;
    btnSalvar.disabled = false;
    return;
  }

  const [ano, mes, dia] = data.split("-");
  const dataFormatada = `${dia}/${mes}/${ano}`;

  const novoAgendamento = { data: dataFormatada, hora, procedimento, especialidade, local, medico, paciente, timestamp: new Date().toISOString() };

  const referencia = agendamentoEmEdicao ? database.ref('agendamentos/' + agendamentoEmEdicao) : database.ref('agendamentos').push();

  referencia.set(novoAgendamento).then(() => {
    alert(agendamentoEmEdicao ? "Atualizado!" : "Agendado!");
    limparCampos();
    abrirAbaDireto('lista'); 
  })
  .catch(error => alert("Erro: " + error.message))
  .finally(() => {
      btnSalvar.innerText = "Salvar Agendamento";
      btnSalvar.disabled = false;
  });
}

function limparCampos() {
  document.getElementById('data-input')._flatpickr.clear();
  document.getElementById('hora-input')._flatpickr.clear();
  document.getElementById('procedimento').value = '';
  document.getElementById('especialidade').value = '';
  document.getElementById('local').value = '';
  document.getElementById('medico').value = '';
  document.getElementById('paciente').value = 'Eva';
  document.getElementById('btn-salvar').innerText = "Salvar Agendamento";
  document.getElementById('btn-cancelar').style.display = 'none';
  
  agendamentoEmEdicao = null;
  document.getElementById('label-medico').textContent = 'Médico:';
}

function cancelarEdicao() {
    limparCampos();
    toggleAba('cadastro'); 
}

function editarAgendamento(id) {
  if (!modoAdmin) return;

  database.ref('agendamentos/' + id).once('value', snapshot => {
    const agendamento = snapshot.val();
    
    const [dia, mes, ano] = agendamento.data.split("/");
    const dataParaFlatpickr = `${ano}-${mes}-${dia}`;
    
    document.getElementById('data-input')._flatpickr.setDate(dataParaFlatpickr);
    document.getElementById('hora-input')._flatpickr.setDate(agendamento.hora);
    
    document.getElementById('procedimento').value = agendamento.procedimento;
    document.getElementById('especialidade').value = agendamento.especialidade;
    document.getElementById('local').value = agendamento.local;
    document.getElementById('medico').value = agendamento.medico || '';
    document.getElementById('paciente').value = agendamento.paciente;
    
    agendamentoEmEdicao = id;
    
    document.getElementById('btn-salvar').innerText = "Atualizar Agendamento";
    document.getElementById('btn-cancelar').style.display = 'block';

    document.getElementById('procedimento').dispatchEvent(new Event('input'));
    
    abrirAbaDireto('cadastro');
    window.scrollTo(0, 0);
  });
}

function confirmarExclusao(id) {
  if (!modoAdmin) return;
  if (window.confirm("Tem certeza que deseja apagar?")) {
    database.ref('agendamentos/' + id).remove();
  }
}

// === LISTAGEM ===

function renderizarLista(agendamentos) {
    const tabela = document.getElementById('agendaTabela');
    tabela.innerHTML = '';
    
    if (!agendamentos) {
        tabela.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhum agendamento encontrado.</p>';
        return;
    }

    Object.keys(agendamentos)
      .map(id => ({ id, ...agendamentos[id] }))
      .sort((a, b) => {
          const [diaA, mesA, anoA] = a.data.split('/');
          const [diaB, mesB, anoB] = b.data.split('/');
          const dataA = new Date(`${anoA}-${mesA}-${diaA}T${a.hora || '00:00'}`);
          const dataB = new Date(`${anoB}-${mesB}-${diaB}T${b.hora || '00:00'}`);
          return dataA - dataB;
      })
      .forEach(agendamento => {
        const div = document.createElement('div');
        div.className = 'agendamento-card';
        div.id = agendamento.id;

        let cardHtml = `
          <div class="card-header">
            <h3>${agendamento.paciente}</h3>
          </div>
          <div class="card-body">
            <p><strong>Data:</strong> ${agendamento.data} às ${agendamento.hora}</p>
            <p><strong>Procedimento:</strong> ${agendamento.procedimento}</p>
            ${agendamento.especialidade ? `<p><strong>Especialidade:</strong> ${agendamento.especialidade}</p>` : ''}
            ${agendamento.medico ? `<p><strong>Profissional:</strong> ${agendamento.medico}</p>` : ''}
            <p><strong>Local:</strong> ${agendamento.local}</p>
          </div>`;

        if (modoAdmin) {
          cardHtml += `
          <div class="card-footer">
            <button class="btn btn-secondary" onclick="editarAgendamento('${agendamento.id}')">✏️ Editar</button>
            <button class="btn btn-danger" onclick="confirmarExclusao('${agendamento.id}')">🗑️ Excluir</button>
            <button class="btn btn-share" onclick="compartilharImagem('${agendamento.id}')">📷 Compartilhar</button>
          </div>`;
        }

        div.innerHTML = cardHtml;
        tabela.appendChild(div);
      });
}

const agendaRef = database.ref('agendamentos');
agendaRef.on('value', snapshot => {
  dadosCache = snapshot.val();
  renderizarLista(dadosCache);
});

// === CORREÇÃO: COMPARTILHAR SEM OS BOTÕES ===
function compartilharImagem(agendamentoId) {
  const agendamentoCard = document.getElementById(agendamentoId);
  const rodapeBotoes = agendamentoCard.querySelector('.card-footer');

  if (rodapeBotoes) {
    rodapeBotoes.style.display = 'none';
  }

  html2canvas(agendamentoCard, {
    onrendered: canvas => {
      const imagem = canvas.toDataURL('image/jpeg');
      const link = document.createElement('a');
      link.href = imagem;
      link.download = 'agendamento.jpg';
      link.click();

      if (rodapeBotoes) {
        rodapeBotoes.style.display = 'flex';
      }
    }
  });
}

// === ATUALIZAÇÃO AUTOMÁTICA DO PWA ===
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
  navigator.serviceWorker.register('service-worker.js');
}

window.addEventListener('DOMContentLoaded', () => {
  flatpickr.localize(flatpickr.l10ns.pt);
  flatpickr("#data-input", { dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", disableMobile: false });
  flatpickr("#hora-input", { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true });
  document.getElementById('procedimento').addEventListener('input', function(event) {
    const texto = event.target.value.toLowerCase();
    document.getElementById('label-medico').textContent = texto.includes('exame') ? 'Médico Solicitante:' : 'Médico:';
  });
});