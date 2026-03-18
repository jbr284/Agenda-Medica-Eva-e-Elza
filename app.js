// === INICIALIZAÇÃO FIREBASE ===
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

// === VARIÁVEIS GLOBAIS ===
let agendamentoEmEdicao = null;
let modoAdmin = false; 
let dadosCache = null;
let filtroAtual = 'Todas'; // Inicia mostrando as duas pacientes

// === LÓGICA DE ACESSO (Com SweetAlert2) ===
function entrarModoVisitante() {
    modoAdmin = false;
    iniciarApp();
}

async function entrarModoAdmin() {
    const { value: senha } = await Swal.fire({
        title: 'Área Restrita',
        input: 'password',
        inputLabel: 'Digite a senha de administrador',
        inputPlaceholder: 'Senha',
        confirmButtonColor: '#007acc',
        cancelButtonColor: '#a0aec0',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Entrar'
    });

    if (senha === "1001") { 
        modoAdmin = true;
        iniciarApp();
        Swal.fire({icon: 'success', title: 'Acesso Liberado!', timer: 1500, showConfirmButton: false});
    } else if (senha) {
        Swal.fire({icon: 'error', title: 'Senha Incorreta!', confirmButtonColor: '#007acc'});
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

    if (dadosCache) renderizarLista(dadosCache);
}

function sairDoApp() {
    document.getElementById('app-principal').classList.add('hidden');
    document.getElementById('tela-login').classList.remove('hidden');
    modoAdmin = false;
    document.querySelectorAll('.tab-content').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.btn-tab').forEach(btn => btn.classList.remove('active'));
}

// === LÓGICA DE ABAS E FILTROS ===
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

function aplicarFiltro(paciente) {
    filtroAtual = paciente;
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filtro-${paciente.toLowerCase()}`).classList.add('active');
    renderizarLista(dadosCache);
}

// === CRUD (Com SweetAlert2) ===
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
        Swal.fire({icon: 'warning', title: 'Atenção', text: 'Preencha Data, Hora, Paciente e Procedimento.', confirmButtonColor: '#007acc'});
        btnSalvar.innerText = textoOriginal;
        btnSalvar.disabled = false;
        return;
    }

    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const novoAgendamento = { data: dataFormatada, hora, procedimento, especialidade, local, medico, paciente, timestamp: new Date().toISOString() };
    const referencia = agendamentoEmEdicao ? database.ref('agendamentos/' + agendamentoEmEdicao) : database.ref('agendamentos').push();

    referencia.set(novoAgendamento).then(() => {
        Swal.fire({icon: 'success', title: agendamentoEmEdicao ? "Atualizado!" : "Agendado!", timer: 1500, showConfirmButton: false});
        limparCampos();
        abrirAbaDireto('lista'); 
    }).catch(error => {
        Swal.fire({icon: 'error', title: 'Erro de conexão', text: error.message});
    }).finally(() => {
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
        document.getElementById('data-input')._flatpickr.setDate(`${ano}-${mes}-${dia}`);
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

async function confirmarExclusao(id) {
    if (!modoAdmin) return;
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Esta consulta será apagada permanentemente!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#a0aec0',
        confirmButtonText: 'Sim, apagar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        database.ref('agendamentos/' + id).remove();
        Swal.fire({icon: 'success', title: 'Apagado!', timer: 1500, showConfirmButton: false});
    }
}

// === LISTAGEM E INTELIGÊNCIA TEMPORAL ===
function renderizarLista(agendamentos) {
    const tabela = document.getElementById('agendaTabela');
    tabela.innerHTML = '';
    
    if (!agendamentos) {
        tabela.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhum agendamento encontrado.</p>';
        return;
    }

    const agora = new Date();

    const listaFiltrada = Object.keys(agendamentos)
        .map(id => ({ id, ...agendamentos[id] }))
        .filter(a => filtroAtual === 'Todas' || a.paciente === filtroAtual)
        .map(a => {
            const [dia, mes, ano] = a.data.split('/');
            a.dataObj = new Date(`${ano}-${mes}-${dia}T${a.hora || '00:00'}`);
            a.passou = a.dataObj < agora; // Identifica se já ficou no passado
            return a;
        })
        .sort((a, b) => {
            // Ordenação: Joga os eventos passados pro final, eventos futuros ficam em cima cronologicamente
            if (a.passou && !b.passou) return 1;
            if (!a.passou && b.passou) return -1;
            return a.dataObj - b.dataObj;
        });

    if (listaFiltrada.length === 0) {
        tabela.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhum agendamento para este filtro.</p>';
        return;
    }

    listaFiltrada.forEach(agendamento => {
        const div = document.createElement('div');
        div.className = `agendamento-card ${agendamento.passou ? 'passado' : ''}`;
        div.id = agendamento.id;

        let cardHtml = `
            <div class="card-header">
            <h3>${agendamento.paciente} ${agendamento.passou ? '<span class="badge-concluido">Concluído</span>' : ''}</h3>
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

// === MELHORIA: COMPARTILHAR COM WEB SHARE API ===
function compartilharImagem(agendamentoId) {
    const agendamentoCard = document.getElementById(agendamentoId);
    const rodapeBotoes = agendamentoCard.querySelector('.card-footer');

    if (rodapeBotoes) rodapeBotoes.style.display = 'none';

    html2canvas(agendamentoCard, {
        onrendered: async canvas => {
            if (rodapeBotoes) rodapeBotoes.style.display = 'flex';
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            
            // Tenta abrir a gaveta de compartilhamento nativa (WhatsApp, etc.)
            try {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'agendamento.jpg', { type: 'image/jpeg' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Agendamento Médico',
                        text: 'Segue o lembrete da nossa consulta:',
                        files: [file]
                    });
                    return; // Se funcionou, não faz o download automático
                }
            } catch (e) {
                console.log("Compartilhamento cancelado ou não suportado na plataforma.");
            }

            // Fallback (Plano B): Se a Web Share API não funcionar (Ex: PC Desktop), faz o download direto
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'agendamento.jpg';
            link.click();
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

// === INICIALIZAÇÃO DE COMPONENTES ===
window.addEventListener('DOMContentLoaded', () => {
    flatpickr.localize(flatpickr.l10ns.pt);
    
    // Melhoria: Trava o minDate para hoje (Evita agendamentos passados por engano)
    flatpickr("#data-input", { 
        dateFormat: "Y-m-d", 
        altInput: true, 
        altFormat: "d/m/Y", 
        disableMobile: false,
        minDate: "today" 
    });
    
    flatpickr("#hora-input", { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true });
    
    document.getElementById('procedimento').addEventListener('input', function(event) {
        const texto = event.target.value.toLowerCase();
        document.getElementById('label-medico').textContent = texto.includes('exame') ? 'Médico Solicitante:' : 'Médico:';
    });
});
