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
let filtroAtual = 'Todas';

// === BASES DE CONHECIMENTO (O CÉREBRO DO SISTEMA) ===
let listaProcedimentosAtuais = [];
let listaEspecialidadesAtuais = [];
let listaLocaisAtuais = [];
let listaMedicosAtuais = [];

const baseProcedimentos = ["Consulta", "Exame", "Retorno", "Cirurgia", "Vacina", "Avaliação"];
const baseLocais = [
    "UBS Amaro José de Souza - Jd Mutinga",
    "UBS Armando Gonçalves de Freitas - Pq Imperial",
    "PS Maria de Lourdes Evangelista - Jd Mutinga",
    "Hospital Municipal Dr. Francisco Moran",
    "Centro de Diagnósticos Maria Mariano Meneghin",
    "Centro de Especialidades Luiz Maria Barletta",
    "Policlínica Cruz Preta/Engenho Novo"
];
const baseEspecialidades = [
    "Alergologia", "Anestesiologia", "Angiologia", "Cardiologia", "Cirurgia Geral", 
    "Cirurgia Plástica", "Cirurgia Vascular", "Clínico Geral", "Coloproctologia", 
    "Dermatologia", "Endocrinologia", "Fisioterapia", "Fonoaudiologia", 
    "Gastroenterologia", "Geriatria", "Ginecologia", "Hematologia", "Hepatologia", 
    "Infectologia", "Mastologia", "Medicina do Trabalho", "Nefrologia", "Neurologia", 
    "Nutrição", "Nutrologia", "Obstetrícia", "Odontologia", "Oftalmologia", 
    "Oncologia", "Ortopedia", "Otorrinolaringologia", "Pediatria", "Pneumologia", 
    "Psicologia", "Psiquiatria", "Radiologia", "Reumatologia", "Urologia"
];

// === MOTOR DE AUTO-PREENCHIMENTO E APRENDIZADO ===
function inicializarListasDinamicas() {
    // Sincroniza Procedimentos
    database.ref('configuracoes/procedimentos').on('value', snap => {
        let salvas = snap.val() ? Object.values(snap.val()) : [];
        listaProcedimentosAtuais = [...new Set([...baseProcedimentos, ...salvas])].sort();
        preencherDatalist('lista-procedimentos', listaProcedimentosAtuais);
    });

    // Sincroniza Especialidades
    database.ref('configuracoes/especialidades').on('value', snap => {
        let salvas = snap.val() ? Object.values(snap.val()) : [];
        listaEspecialidadesAtuais = [...new Set([...baseEspecialidades, ...salvas])].sort();
        preencherDatalist('lista-especialidades', listaEspecialidadesAtuais);
    });

    // Sincroniza Locais
    database.ref('configuracoes/locais').on('value', snap => {
        let salvas = snap.val() ? Object.values(snap.val()) : [];
        listaLocaisAtuais = [...new Set([...baseLocais, ...salvas])].sort();
        preencherDatalist('lista-locais', listaLocaisAtuais);
    });

    // Sincroniza Médicos
    database.ref('configuracoes/medicos').on('value', snap => {
        let salvas = snap.val() ? Object.values(snap.val()) : [];
        listaMedicosAtuais = [...new Set([...salvas])].sort();
        preencherDatalist('lista-medicos', listaMedicosAtuais);
    });
}

function preencherDatalist(idElemento, arrayDados) {
    const datalist = document.getElementById(idElemento);
    if (!datalist) return;
    datalist.innerHTML = '';
    arrayDados.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
    });
}

function aprenderNovoTermo(caminho, termoDigitado, listaAtual) {
    if (!termoDigitado || termoDigitado.trim() === "") return;
    const termoFormatado = termoDigitado.trim().charAt(0).toUpperCase() + termoDigitado.trim().slice(1);
    
    // Verifica se o termo já existe ignorando maiúsculas/minúsculas
    const termoExiste = listaAtual.some(item => item.toLowerCase() === termoFormatado.toLowerCase());
    
    if (!termoExiste) {
        database.ref(`configuracoes/${caminho}`).push(termoFormatado);
    }
}

// === LÓGICA DE ACESSO ===
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
        confirmButtonColor: '#2563eb',
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
        Swal.fire({icon: 'error', title: 'Senha Incorreta!', confirmButtonColor: '#2563eb'});
    }
}

function iniciarApp() {
    document.getElementById('tela-login').classList.add('hidden');
    document.getElementById('app-principal').classList.remove('hidden');
    if (modoAdmin) document.getElementById('btn-tab-cadastro').classList.remove('hidden');
    else document.getElementById('btn-tab-cadastro').classList.add('hidden');
    if (dadosCache) renderizarLista(dadosCache);
}

function sairDoApp() {
    document.getElementById('app-principal').classList.add('hidden');
    document.getElementById('tela-login').classList.remove('hidden');
    modoAdmin = false;
    document.querySelectorAll('.tab-content').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.btn-tab').forEach(btn => btn.classList.remove('active'));
}

// === ABAS E FILTROS ===
function toggleAba(nomeAba) {
    const abaDestino = document.getElementById(`tab-${nomeAba}`);
    if (abaDestino.classList.contains('active')) return;
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

// === CRUD COM APRENDIZADO ===
function adicionarAgendamento() {
    if (!modoAdmin) return; 

    const btnSalvar = document.getElementById('btn-salvar');
    btnSalvar.innerHTML = `<i class="ph-bold ph-spinner-gap ph-spin"></i> Salvando...`;
    btnSalvar.disabled = true;

    const data = document.getElementById('data-input').value; 
    const hora = document.getElementById('hora-input').value;
    const procedimento = document.getElementById('procedimento').value;
    const especialidade = document.getElementById('especialidade').value;
    const local = document.getElementById('local').value;
    const medico = document.getElementById('medico').value;
    const paciente = document.getElementById('paciente').value;
    
    if (!data || !hora || !procedimento || !paciente) {
        Swal.fire({icon: 'warning', title: 'Atenção', text: 'Preencha Data, Hora, Paciente e Procedimento.', confirmButtonColor: '#2563eb'});
        btnSalvar.innerHTML = `<i class="ph-bold ph-floppy-disk"></i> Gravar Agendamento`;
        btnSalvar.disabled = false;
        return;
    }

    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const novoAgendamento = { data: dataFormatada, hora, procedimento, especialidade, local, medico, paciente, timestamp: new Date().toISOString() };
    
    // ATIVA O CÉREBRO: O robô aprende os termos recém digitados
    aprenderNovoTermo('procedimentos', procedimento, listaProcedimentosAtuais);
    aprenderNovoTermo('locais', local, listaLocaisAtuais);
    if (especialidade) aprenderNovoTermo('especialidades', especialidade, listaEspecialidadesAtuais);
    if (medico) aprenderNovoTermo('medicos', medico, listaMedicosAtuais);

    const referencia = agendamentoEmEdicao ? database.ref('agendamentos/' + agendamentoEmEdicao) : database.ref('agendamentos').push();

    referencia.set(novoAgendamento).then(() => {
        Swal.fire({icon: 'success', title: agendamentoEmEdicao ? "Atualizado!" : "Agendado!", timer: 1500, showConfirmButton: false});
        limparCampos();
        abrirAbaDireto('lista'); 
    }).catch(error => {
        Swal.fire({icon: 'error', title: 'Erro', text: error.message});
    }).finally(() => {
        btnSalvar.innerHTML = `<i class="ph-bold ph-floppy-disk"></i> Gravar Agendamento`;
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
    document.getElementById('btn-cancelar').style.display = 'none';
    agendamentoEmEdicao = null;
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
        document.getElementById('btn-cancelar').style.display = 'block';
        
        abrirAbaDireto('cadastro');
        window.scrollTo(0, 0);
    });
}

async function confirmarExclusao(id) {
    if (!modoAdmin) return;
    const result = await Swal.fire({
        title: 'Excluir Consulta?',
        text: "Essa ação não pode ser desfeita.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#cbd5e1',
        confirmButtonText: 'Sim, apagar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        database.ref('agendamentos/' + id).remove();
        Swal.fire({icon: 'success', title: 'Apagado!', timer: 1500, showConfirmButton: false});
    }
}

// === RENDERIZAÇÃO DE CARDS ===
function renderizarLista(agendamentos) {
    const tabela = document.getElementById('agendaTabela');
    tabela.innerHTML = '';
    
    if (!agendamentos) {
        tabela.innerHTML = '<p class="loading-text">Nenhum agendamento encontrado.</p>';
        return;
    }

    const hojeObj = new Date();
    hojeObj.setHours(0,0,0,0);

    const listaFiltrada = Object.keys(agendamentos)
        .map(id => ({ id, ...agendamentos[id] }))
        .filter(a => filtroAtual === 'Todas' || a.paciente === filtroAtual)
        .map(a => {
            const [dia, mes, ano] = a.data.split('/');
            a.dataObj = new Date(`${ano}-${mes}-${dia}T${a.hora || '00:00'}`);
            
            const dataBase = new Date(`${ano}-${mes}-${dia}T00:00:00`);
            const diffTime = dataBase - hojeObj;
            a.diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            a.passou = a.diffDays < 0; 
            return a;
        })
        .sort((a, b) => {
            if (a.passou && !b.passou) return 1;
            if (!a.passou && b.passou) return -1;
            return a.dataObj - b.dataObj;
        });

    if (listaFiltrada.length === 0) {
        tabela.innerHTML = '<p class="loading-text">Nenhum agendamento para este filtro.</p>';
        return;
    }

    const mesesAbrev = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

    listaFiltrada.forEach(ag => {
        const div = document.createElement('div');
        const themeClass = ag.paciente === 'Eva' ? 'theme-eva' : 'theme-elza';
        div.className = `agendamento-card ${themeClass} ${ag.passou ? 'passado' : ''}`;
        div.id = ag.id;

        const [dia, mes] = ag.data.split('/');
        const nomeMes = mesesAbrev[parseInt(mes) - 1];

        let badgeHtml = '';
        if (ag.passou) badgeHtml = `<span class="badge-concluido"><i class="ph-bold ph-check-circle"></i> Concluído</span>`;
        else if (ag.diffDays === 0) badgeHtml = `<span class="badge-hoje"><i class="ph-fill ph-warning-circle"></i> Hoje!</span>`;
        else if (ag.diffDays === 1) badgeHtml = `<span class="badge-amanha"><i class="ph-fill ph-lightning"></i> Amanhã</span>`;
        else if (ag.diffDays > 1 && ag.diffDays <= 7) badgeHtml = `<span class="badge-semana"><i class="ph-fill ph-calendar-blank"></i> Em ${ag.diffDays} dias</span>`;

        let cardHtml = `
            <div class="card-main">
                <div class="card-calendar">
                    <span class="dia">${dia}</span>
                    <span class="mes">${nomeMes}</span>
                    <span class="hora"><i class="ph-bold ph-clock"></i> ${ag.hora}</span>
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <h3>${ag.paciente}</h3>
                        ${badgeHtml}
                    </div>
                    <div class="card-body">
                        <p><i class="ph-fill ph-stethoscope"></i> <span><strong>Procedimento:</strong> ${ag.procedimento}</span></p>
                        ${ag.especialidade ? `<p><i class="ph-fill ph-first-aid"></i> <span><strong>Especialidade:</strong> ${ag.especialidade}</span></p>` : ''}
                        ${ag.medico ? `<p><i class="ph-fill ph-user-circle"></i> <span><strong>Profissional:</strong> ${ag.medico}</span></p>` : ''}
                        <p><i class="ph-fill ph-map-pin"></i> <span><strong>Local:</strong> ${ag.local}</span></p>
                    </div>
                </div>
            </div>`;

        if (modoAdmin) {
            cardHtml += `
            <div class="card-footer">
                <button class="btn-ghost btn-ghost-edit" onclick="editarAgendamento('${ag.id}')"><i class="ph-bold ph-pencil-simple"></i> Editar</button>
                <button class="btn-ghost btn-ghost-delete" onclick="confirmarExclusao('${ag.id}')"><i class="ph-bold ph-trash"></i> Excluir</button>
                <button class="btn-ghost btn-ghost-share" onclick="compartilharImagem('${ag.id}')"><i class="ph-bold ph-share-network"></i> Compartilhar</button>
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

// === COMPARTILHAMENTO INTELIGENTE ===
function compartilharImagem(agendamentoId) {
    const agendamentoCard = document.getElementById(agendamentoId);
    const rodapeBotoes = agendamentoCard.querySelector('.card-footer');
    if (rodapeBotoes) rodapeBotoes.style.display = 'none';

    html2canvas(agendamentoCard, {
        onrendered: async canvas => {
            if (rodapeBotoes) rodapeBotoes.style.display = 'flex';
            const dataUrl = canvas.toDataURL('image/jpeg');
            
            try {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'agendamento.jpg', { type: 'image/jpeg' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ title: 'Agendamento Médico', text: 'Segue o lembrete da nossa consulta:', files: [file] });
                    return; 
                }
            } catch (e) { console.log("Compartilhamento nativo não suportado."); }

            const link = document.createElement('a');
            link.href = dataUrl; link.download = 'agendamento.jpg'; link.click();
        }
    });
}

// === PWA E PLUGINS ===
if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) { window.location.reload(); refreshing = true; }
    });
    navigator.serviceWorker.register('service-worker.js');
}

window.addEventListener('DOMContentLoaded', () => {
    flatpickr.localize(flatpickr.l10ns.pt);
    flatpickr("#data-input", { dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", disableMobile: false, minDate: "today" });
    flatpickr("#hora-input", { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true });
    
    // INICIA O CÉREBRO DE APRENDIZADO
    inicializarListasDinamicas();
});
