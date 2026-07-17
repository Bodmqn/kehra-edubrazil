// Seed script: imports CSV data into Supabase universities table
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const universities = [
  { sno: 1, name: 'Universidade Estadual de Roraima', acronym: 'UERR', region: 'Norte', state: 'Roraima', type: 'State', sigaa_url: 'Edital - UERR Univesity of Roraima', school_url: 'https://uerr.edu.br/' },
  { sno: 2, name: 'Universidade Estadual do Tocantins', acronym: 'UNITINS', region: 'Norte', state: 'Tocantins', type: 'State', sigaa_url: 'https://www.unitins.br/concursos/publico', school_url: 'https://www.unitins.br/' },
  { sno: 3, name: 'Universidade Federal Rural da Amazônia', acronym: 'UFRA', region: 'Norte', state: 'Pará', type: 'Federal', sigaa_url: 'https://sigaa.ufra.edu.br/sigaa/public/processo_seletivo/lista.jsf?nivel=S&aba=p-stricto', school_url: 'https://www.ufra.edu.br/' },
  { sno: 4, name: 'Universidade Federal de Rondônia', acronym: 'UNIR', region: 'Norte', state: 'Rondônia', type: 'Federal', sigaa_url: 'https://sigaa.unir.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.unir.br/' },
  { sno: 5, name: 'Universidade Federal de Roraima', acronym: 'UFRR', region: 'Norte', state: 'Roraima', type: 'Federal', sigaa_url: 'https://sigaa.ufrr.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufrr.br/' },
  { sno: 6, name: 'Universidade Federal do Acre', acronym: 'UFAC', region: 'Norte', state: 'Acre', type: 'Federal', sigaa_url: 'https://www.ufac.br/site/ufac/propeg/mestrados-e-doutorados', school_url: 'https://www.ufac.br/' },
  { sno: 7, name: 'Universidade Federal do Amapá', acronym: 'UNIFAP', region: 'Norte', state: 'Amapá', type: 'Federal', sigaa_url: 'https://sigaa.unifap.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.unifap.br/' },
  { sno: 8, name: 'Universidade Federal do Amazonas', acronym: 'UFAM', region: 'Norte', state: 'Amazonas', type: 'Federal', sigaa_url: 'https://ppgee.ufam.edu.br/editais-de-selecao.html', school_url: 'https://www.ufam.edu.br/' },
  { sno: 9, name: 'Universidade Federal do Norte do Tocantins', acronym: 'UFNT', region: 'Norte', state: 'Tocantins', type: 'Federal', sigaa_url: 'https://sistemas.ufnt.edu.br/seletivos', school_url: 'https://ufnt.edu.br/' },
  { sno: 10, name: 'Universidade Federal do Oeste do Pará', acronym: 'UFOPA', region: 'Norte', state: 'Pará', type: 'Federal', sigaa_url: 'https://sigaa.ufopa.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufopa.edu.br/' },
  { sno: 11, name: 'Universidade Federal do Pará', acronym: 'UFPA', region: 'Norte', state: 'Pará', type: 'Federal', sigaa_url: 'https://sigaa.ufpa.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufpa.br/' },
  { sno: 12, name: 'Universidade Federal do Sul e Sudeste do Pará', acronym: 'UNIFESSPA', region: 'Norte', state: 'Pará', type: 'Federal', sigaa_url: 'https://sigaa.unifesspa.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.unifesspa.edu.br/' },
  { sno: 13, name: 'Universidade Federal do Tocantins', acronym: 'UFT', region: 'Norte', state: 'Tocantins', type: 'Federal', sigaa_url: 'https://www.uft.edu.br/concursos-e-selecoes', school_url: 'https://www.uft.edu.br/' },
  { sno: 14, name: 'Universidade do Estado do Amazonas', acronym: 'UEA', region: 'Norte', state: 'Amazonas', type: 'State', sigaa_url: 'https://selecao1.uea.edu.br/', school_url: 'https://www.uea.edu.br/' },
  { sno: 15, name: 'Universidade do Estado do Pará', acronym: 'UEPA', region: 'Norte', state: 'Pará', type: 'State', sigaa_url: 'https://sigaa.uepa.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.uepa.br/' },
  { sno: 16, name: 'Universidade Estadual Vale do Acaraú', acronym: 'UVA', region: 'Nordeste', state: 'Ceará', type: 'State', sigaa_url: 'https://ww2.uva.ce.gov.br/apps/view/listagem_documentos.php?buscar=0103', school_url: 'https://uvanet.br' },
  { sno: 17, name: 'Universidade Estadual da Paraíba', acronym: 'UEPB', region: 'Nordeste', state: 'Paraíba', type: 'State', sigaa_url: 'https://uepb.edu.br/editais/selecao-de-pos-graduacao/', school_url: 'https://uepb.edu.br/' },
  { sno: 18, name: 'Universidade Estadual da Região Tocantina do Maranhão', acronym: 'UEMASUL', region: 'Nordeste', state: 'Maranhão', type: 'State', sigaa_url: 'https://sigaa.uemasul.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.uemasul.edu.br/' },
  { sno: 19, name: 'Universidade Estadual de Alagoas', acronym: 'UNEAL', region: 'Nordeste', state: 'Alagoas', type: 'State', sigaa_url: 'https://www.uneal.edu.br/editais/editais-2026', school_url: 'https://www.uneal.edu.br/' },
  { sno: 20, name: 'Universidade Estadual de Ciências da Saúde de Alagoas', acronym: 'UNCISAL', region: 'Nordeste', state: 'Alagoas', type: 'State', sigaa_url: 'https://novo.uncisal.edu.br/editais/pos-graduacao/', school_url: 'https://novo.uncisal.edu.br/' },
  { sno: 21, name: 'Universidade Estadual de Feira de Santana', acronym: 'UEFS', region: 'Nordeste', state: 'Bahia', type: 'State', sigaa_url: 'https://www.uefs.br/modules/conteudo/conteudo.php?conteudo=11', school_url: 'https://www.uefs.br/' },
  { sno: 22, name: 'Universidade Estadual de Santa Cruz', acronym: 'UESC', region: 'Nordeste', state: 'Bahia', type: 'State', sigaa_url: 'https://sig.uesc.br/sigaa/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.uesc.br/' },
  { sno: 23, name: 'Universidade Estadual do Ceará', acronym: 'UECE', region: 'Nordeste', state: 'Ceará', type: 'State', sigaa_url: 'https://www.uece.br/propgpq/', school_url: 'https://www.uece.br/' },
  { sno: 24, name: 'Universidade Estadual do Maranhão', acronym: 'UEMA', region: 'Nordeste', state: 'Maranhão', type: 'State', sigaa_url: 'https://sigaa.uema.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.uema.br/' },
  { sno: 25, name: 'Universidade Estadual do Piauí', acronym: 'UESPI', region: 'Nordeste', state: 'Piauí', type: 'State', sigaa_url: 'https://www.uespi.br/editais', school_url: 'https://uespi.br/' },
  { sno: 26, name: 'Universidade Estadual do Sudoeste da Bahia', acronym: 'UESB', region: 'Nordeste', state: 'Bahia', type: 'State', sigaa_url: 'https://www.uesb.br/editais/', school_url: 'https://www.uesb.br/' },
  { sno: 27, name: 'Universidade Federal Rural de Pernambuco', acronym: 'UFRPE', region: 'Nordeste', state: 'Pernambuco', type: 'Federal', sigaa_url: 'https://sigs.ufrpe.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufrpe.br/' },
  { sno: 28, name: 'Universidade Federal Rural do Semi-Árido', acronym: 'UFERSA', region: 'Nordeste', state: 'Rio Grande do Norte', type: 'Federal', sigaa_url: 'https://sigaa.ufersa.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufersa.edu.br/' },
  { sno: 29, name: 'Universidade Federal da Bahia', acronym: 'UFBA', region: 'Nordeste', state: 'Bahia', type: 'Federal', sigaa_url: 'https://sigaa.ufba.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufba.br/' },
  { sno: 30, name: 'Universidade Federal da Lusofonia Afro-Brasileira', acronym: 'UNILAB', region: 'Nordeste', state: 'Ceará/Bahia', type: 'Federal', sigaa_url: 'https://sig.unilab.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://unilab.edu.br/' },
  { sno: 31, name: 'Universidade Federal da Paraíba', acronym: 'UFPB', region: 'Nordeste', state: 'Paraíba', type: 'Federal', sigaa_url: 'https://sigaa.ufpb.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufpb.br/' },
  { sno: 32, name: 'Universidade Federal de Alagoas', acronym: 'UFAL', region: 'Nordeste', state: 'Alagoas', type: 'Federal', sigaa_url: 'https://sigaa.sig.ufal.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufal.br/' },
  { sno: 33, name: 'Universidade Federal de Campina Grande', acronym: 'UFCG', region: 'Nordeste', state: 'Paraíba', type: 'Federal', sigaa_url: 'https://sigaa.ufcg.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufcg.edu.br' },
  { sno: 34, name: 'Universidade Federal de Pernambuco', acronym: 'UFPE', region: 'Nordeste', state: 'Pernambuco', type: 'Federal', sigaa_url: 'https://sigaa.ufpe.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufpe.br/' },
  { sno: 35, name: 'Universidade Federal de Sergipe', acronym: 'UFS', region: 'Nordeste', state: 'Sergipe', type: 'Federal', sigaa_url: 'https://sigaa.ufs.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufs.br/' },
  { sno: 36, name: 'Universidade Federal do Agreste de Pernambuco', acronym: 'UFAPE', region: 'Nordeste', state: 'Pernambuco', type: 'Federal', sigaa_url: 'https://sigs.ufape.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufape.edu.br/' },
  { sno: 37, name: 'Universidade Federal do Cariri', acronym: 'UFCA', region: 'Nordeste', state: 'Ceará', type: 'Federal', sigaa_url: 'https://sig.ufca.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufca.edu.br/' },
  { sno: 38, name: 'Universidade Federal do Ceará', acronym: 'UFC', region: 'Nordeste', state: 'Ceará', type: 'Federal', sigaa_url: 'https://sigaa.ufc.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://portal.ufc.br/' },
  { sno: 39, name: 'Universidade Federal do Delta do Parnaíba', acronym: 'UFDPar', region: 'Nordeste', state: 'Piauí', type: 'Federal', sigaa_url: 'https://sigaa.ufdpar.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufdpar.edu.br/' },
  { sno: 40, name: 'Universidade Federal do Maranhão', acronym: 'UFMA', region: 'Nordeste', state: 'Maranhão', type: 'Federal', sigaa_url: 'https://sigaa.ufma.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufma.br/' },
  { sno: 41, name: 'Universidade Federal do Oeste da Bahia', acronym: 'UFOB', region: 'Nordeste', state: 'Bahia', type: 'Federal', sigaa_url: 'https://sig.ufob.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufob.edu.br/' },
  { sno: 42, name: 'Universidade Federal do Piauí', acronym: 'UFPI', region: 'Nordeste', state: 'Piauí', type: 'Federal', sigaa_url: 'https://sigaa.ufpi.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufpi.br/' },
  { sno: 43, name: 'Universidade Federal do Recôncavo da Bahia', acronym: 'UFRB', region: 'Nordeste', state: 'Bahia', type: 'Federal', sigaa_url: 'https://www.ufrb.edu.br/ppgecd/processos-seletivos', school_url: 'https://www.ufrb.edu.br/' },
  { sno: 44, name: 'Universidade Federal do Rio Grande do Norte', acronym: 'UFRN', region: 'Nordeste', state: 'Rio Grande do Norte', type: 'Federal', sigaa_url: 'https://sigaa.ufrn.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufrn.br/' },
  { sno: 45, name: 'Universidade Federal do Sul da Bahia', acronym: 'UFSB', region: 'Nordeste', state: 'Bahia', type: 'Federal', sigaa_url: 'https://sig.ufsb.edu.br/sigaa/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufsb.edu.br/' },
  { sno: 46, name: 'Universidade Federal do Vale do São Francisco', acronym: 'UNIVASF', region: 'Nordeste', state: 'Bahia/Pernambuco/Piauí', type: 'Federal', sigaa_url: 'https://ps.univasf.edu.br/', school_url: 'https://www.univasf.edu.br/' },
  { sno: 47, name: 'Universidade Regional do Cariri', acronym: 'URCA', region: 'Nordeste', state: 'Ceará', type: 'State', sigaa_url: 'https://www.urca.br/prpgp/chamadas-publicas/', school_url: 'https://www.urca.br/' },
  { sno: 48, name: 'Universidade de Pernambuco', acronym: 'UPE', region: 'Nordeste', state: 'Pernambuco', type: 'State', sigaa_url: 'https://sigaa.upe.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.upe.br/' },
  { sno: 49, name: 'Universidade do Estado da Bahia', acronym: 'UNEB', region: 'Nordeste', state: 'Bahia', type: 'State', sigaa_url: 'https://www.ssppg.uneb.br/', school_url: 'https://www.uneb.br' },
  { sno: 50, name: 'Universidade do Estado do Rio Grande do Norte', acronym: 'UERN', region: 'Nordeste', state: 'Rio Grande do Norte', type: 'State', sigaa_url: 'https://sigaa.uern.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://portal.uern.br/' },
  { sno: 51, name: 'Universidade Estadual de Goiás', acronym: 'UEG', region: 'Centro-Oeste', state: 'Goiás', type: 'State', sigaa_url: 'https://www.ueg.br/prp/conteudo/21253______editais_de_processos_seletivos_stricto_sensu', school_url: 'https://www.ueg.br/' },
  { sno: 52, name: 'Universidade Estadual de Mato Grosso do Sul', acronym: 'UEMS', region: 'Centro-Oeste', state: 'Mato Grosso do Sul', type: 'State', sigaa_url: 'https://www.uems.br/editais', school_url: 'https://www.uems.br/' },
  { sno: 53, name: 'Universidade Federal da Grande Dourados', acronym: 'UFGD', region: 'Centro-Oeste', state: 'Mato Grosso do Sul', type: 'Federal', sigaa_url: 'https://sistemas.ufgd.edu.br/scpg-inscricao', school_url: 'https://www.ufgd.edu.br/' },
  { sno: 54, name: 'Universidade Federal de Catalão', acronym: 'UFCat', region: 'Centro-Oeste', state: 'Goiás', type: 'Federal', sigaa_url: 'https://sigaa.ufcat.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufcat.edu.br/' },
  { sno: 55, name: 'Universidade Federal de Goiás', acronym: 'UFG', region: 'Centro-Oeste', state: 'Goiás', type: 'Federal', sigaa_url: 'https://sigaa.ufg.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufg.br/' },
  { sno: 56, name: 'Universidade Federal de Jataí', acronym: 'UFJ', region: 'Centro-Oeste', state: 'Goiás', type: 'Federal', sigaa_url: 'https://sigaa.sistemas.ufj.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-processo&nivel=S', school_url: 'https://www.ufj.edu.br' },
  { sno: 57, name: 'Universidade Federal de Mato Grosso', acronym: 'UFMT', region: 'Centro-Oeste', state: 'Mato Grosso', type: 'Federal', sigaa_url: 'https://www.ufmt.br/ingresso/', school_url: 'https://www.ufmt.br/' },
  { sno: 58, name: 'Universidade Federal de Mato Grosso do Sul', acronym: 'UFMS', region: 'Centro-Oeste', state: 'Mato Grosso do Sul', type: 'Federal', sigaa_url: 'https://propp.ufms.br/processo/psu/', school_url: 'https://www.ufms.br/' },
  { sno: 59, name: 'Universidade Federal de Rondonópolis', acronym: 'UFR', region: 'Centro-Oeste', state: 'Mato Grosso', type: 'Federal', sigaa_url: 'https://ufr.edu.br/seletivos/', school_url: 'https://ufr.edu.br/' },
  { sno: 60, name: 'Universidade de Brasília', acronym: 'UnB', region: 'Centro-Oeste', state: 'Distrito Federal', type: 'Federal', sigaa_url: 'https://sigaa.unb.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.unb.br/' },
  { sno: 61, name: 'Universidade do Estado de Mato Grosso', acronym: 'UNEMAT', region: 'Centro-Oeste', state: 'Mato Grosso', type: 'State', sigaa_url: 'https://sigaa.unemat.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://unemat.br/' },
  { sno: 62, name: 'Fundação Centro Universitário Zona Oeste do Rio de Janeiro', acronym: 'UEZO', region: 'Sudeste', state: 'Rio de Janeiro', type: 'State', sigaa_url: 'http://www.uezo.rj.gov.br/pos-graduacao/processo-seletivo.php', school_url: 'http://www.uezo.rj.gov.br/' },
  { sno: 63, name: 'Universidade Estadual Paulista "Júlio de Mesquita Filho"', acronym: 'UNESP', region: 'Sudeste', state: 'São Paulo', type: 'State', sigaa_url: 'https://www2.unesp.br/portal#!/propg/ingresso', school_url: 'https://www2.unesp.br/' },
  { sno: 64, name: 'Universidade Estadual de Campinas', acronym: 'UNICAMP', region: 'Sudeste', state: 'São Paulo', type: 'State', sigaa_url: 'https://prpg.unicamp.br/editais/', school_url: 'https://www.unicamp.br/' },
  { sno: 65, name: 'Universidade Estadual de Montes Claros', acronym: 'UNIMONTES', region: 'Sudeste', state: 'Minas Gerais', type: 'State', sigaa_url: 'https://www.posgraduacao.unimontes.br/editais/editais-stricto-sensu/', school_url: 'https://www.unimontes.br/' },
  { sno: 66, name: 'Universidade Estadual do Norte Fluminense', acronym: 'UENF', region: 'Sudeste', state: 'Rio de Janeiro', type: 'State', sigaa_url: 'https://uenf.br/portal/editais/5/', school_url: 'https://www.uenf.br/' },
  { sno: 67, name: 'Universidade Federal Fluminense', acronym: 'UFF', region: 'Sudeste', state: 'Rio de Janeiro', type: 'Federal', sigaa_url: 'http://poscardio.sites.uff.br/?page_id=4612', school_url: 'https://www.uff.br/' },
  { sno: 68, name: 'Universidade Federal Rural do Rio de Janeiro', acronym: 'UFRRJ', region: 'Sudeste', state: 'Rio de Janeiro', type: 'Federal', sigaa_url: 'https://sigaa.ufrrj.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufrrj.br/' },
  { sno: 69, name: 'Universidade Federal de Alfenas', acronym: 'UNIFAL-MG', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://www.unifal-mg.edu.br/portal/tag/processos-seletivos/', school_url: 'https://www.unifal-mg.edu.br/' },
  { sno: 70, name: 'Universidade Federal de Itajubá', acronym: 'UNIFEI', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://sigaa.unifei.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://unifei.edu.br/' },
  { sno: 71, name: 'Universidade Federal de Juiz de Fora', acronym: 'UFJF', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://www2.ufjf.br/cdara/pos-graduacao-inscricao-matricula-e-cadastro-na-ufjf/', school_url: 'https://www2.ufjf.br/ufjf/' },
  { sno: 72, name: 'Universidade Federal de Lavras', acronym: 'UFLA', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://sigaa.ufla.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufla.br/' },
  { sno: 73, name: 'Universidade Federal de Minas Gerais', acronym: 'UFMG', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://www.ufmg.br/prpg/editais/', school_url: 'https://www.ufmg.br/' },
  { sno: 74, name: 'Universidade Federal de Ouro Preto', acronym: 'UFOP', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://ufop.br/taxonomy/term/28', school_url: 'https://www.ufop.br/' },
  { sno: 75, name: 'Universidade Federal de São Carlos', acronym: 'UFSCar', region: 'Sudeste', state: 'São Paulo', type: 'Federal', sigaa_url: 'https://www.propg.ufscar.br/pt-br/pos-na-ufscar/programas', school_url: 'https://www.ufscar.br/' },
  { sno: 76, name: 'Universidade Federal de São João del-Rei', acronym: 'UFSJ', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://sig.ufsj.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://ufsj.edu.br/' },
  { sno: 77, name: 'Universidade Federal de São Paulo', acronym: 'UNIFESP', region: 'Sudeste', state: 'São Paulo', type: 'Federal', sigaa_url: 'https://proreitoria.unifesp.br/propgpq/pos-graduacao/programas-de-pos-graduacao-stricto-sensu', school_url: 'https://www.unifesp.br/' },
  { sno: 78, name: 'Universidade Federal de Uberlândia', acronym: 'UFU', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://www.portalselecao.ufu.br/servicos/edital/listar', school_url: 'https://ufu.br/' },
  { sno: 79, name: 'Universidade Federal de Viçosa', acronym: 'UFV', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://www.ufv.br/pos-graduacao/', school_url: 'https://www.ufv.br/' },
  { sno: 80, name: 'Universidade Federal do ABC', acronym: 'UFABC', region: 'Sudeste', state: 'São Paulo', type: 'Federal', sigaa_url: 'https://sig.ufabc.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.ufabc.edu.br/' },
  { sno: 81, name: 'Universidade Federal do Espírito Santo', acronym: 'UFES', region: 'Sudeste', state: 'Espírito Santo', type: 'Federal', sigaa_url: 'https://prppg.ufes.br/conteudo/novos-editais-de-ingresso-para-os-programas-de-p%C3%B3s-gradua%C3%A7%C3%A3o-da-ufes', school_url: 'https://www.ufes.br/' },
  { sno: 82, name: 'Universidade Federal do Estado do Rio de Janeiro', acronym: 'UNIRIO', region: 'Sudeste', state: 'Rio de Janeiro', type: 'Federal', sigaa_url: 'https://www.unirio.br/propg/diretoria-de-pos-graduacao-2/editais', school_url: 'https://www.unirio.br' },
  { sno: 83, name: 'Universidade Federal do Rio de Janeiro', acronym: 'UFRJ', region: 'Sudeste', state: 'Rio de Janeiro', type: 'Federal', sigaa_url: 'https://www.ie.ufrj.br/pos-graduacao-j/pos-graduacao-em-economia/ppge-selecao.html', school_url: 'https://ufrj.br/' },
  { sno: 84, name: 'Universidade Federal do Triângulo Mineiro', acronym: 'UFTM', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://www.uftm.edu.br/pos-graduacao/stricto-sensu', school_url: 'https://www.uftm.edu.br/' },
  { sno: 85, name: 'Universidade Federal dos Vales do Jequitinhonha e Mucuri', acronym: 'UFVJM', region: 'Sudeste', state: 'Minas Gerais', type: 'Federal', sigaa_url: 'https://portal.ufvjm.edu.br/editais', school_url: 'https://www.ufvjm.edu.br/' },
  { sno: 86, name: 'Universidade Virtual do Estado de São Paulo', acronym: 'UNIVESP', region: 'Sudeste', state: 'São Paulo', type: 'State', sigaa_url: 'https://univesp.br/pos-graduacao', school_url: 'https://univesp.br/' },
  { sno: 87, name: 'Universidade de São Paulo', acronym: 'USP', region: 'Sudeste', state: 'São Paulo', type: 'State', sigaa_url: 'https://www5.usp.br/ensino/pos-graduacao/', school_url: 'https://www.usp.br/' },
  { sno: 88, name: 'Universidade do Estado de Minas Gerais', acronym: 'UEMG', region: 'Sudeste', state: 'Minas Gerais', type: 'State', sigaa_url: 'https://pos.uemg.br/', school_url: 'https://www.uemg.br/' },
  { sno: 89, name: 'Universidade do Estado do Rio de Janeiro', acronym: 'UERJ', region: 'Sudeste', state: 'Rio de Janeiro', type: 'State', sigaa_url: 'https://sig.uerj.br/sigaa/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.uerj.br/' },
  { sno: 90, name: 'Universidade Estadual de Londrina', acronym: 'UEL', region: 'Sul', state: 'Paraná', type: 'State', sigaa_url: 'https://sites.uel.br/proppg/inscricoes', school_url: 'https://www.uel.br/' },
  { sno: 91, name: 'Universidade Estadual de Maringá', acronym: 'UEM', region: 'Sul', state: 'Paraná', type: 'State', sigaa_url: 'https://sigs.uem.br/sigaa/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.uem.br/' },
  { sno: 92, name: 'Universidade Estadual de Ponta Grossa', acronym: 'UEPG', region: 'Sul', state: 'Paraná', type: 'State', sigaa_url: 'https://www2.uepg.br/propesp/editais-pos-graduacao-stricto-sensu/', school_url: 'https://www.uepg.br/' },
  { sno: 93, name: 'Universidade Estadual do Centro-Oeste', acronym: 'UNICENTRO', region: 'Sul', state: 'Paraná', type: 'State', sigaa_url: 'https://www3.unicentro.br/propesp/pos-graduacao/stricto-sensu/editais/', school_url: 'https://www.unicentro.br/' },
  { sno: 94, name: 'Universidade Estadual do Norte do Paraná', acronym: 'UENP', region: 'Sul', state: 'Paraná', type: 'State', sigaa_url: 'https://uenp.edu.br/pos-graduacao/processos-seletivos', school_url: 'https://www.uenp.edu.br/' },
  { sno: 95, name: 'Universidade Estadual do Oeste do Paraná', acronym: 'UNIOESTE', region: 'Sul', state: 'Paraná', type: 'State', sigaa_url: 'https://www.unioeste.br/portal/prppg/cursos/stricto-sensu-mestrado-doutorado', school_url: 'https://www.unioeste.br/' },
  { sno: 96, name: 'Universidade Estadual do Paraná', acronym: 'UNESPAR', region: 'Sul', state: 'Paraná', type: 'State', sigaa_url: 'https://prppg.unespar.edu.br/pos-graduacao/stricto-sensu', school_url: 'https://www.unespar.edu.br/' },
  { sno: 97, name: 'Universidade Estadual do Rio Grande do Sul', acronym: 'UERGS', region: 'Sul', state: 'Rio Grande do Sul', type: 'State', sigaa_url: 'https://proppg.uergs.edu.br/', school_url: 'https://uergs.edu.br/' },
  { sno: 98, name: 'Universidade Federal da Fronteira Sul', acronym: 'UFFS', region: 'Sul', state: 'Rio Grande do Sul/Santa Catarina/Paraná', type: 'Federal', sigaa_url: 'https://sigaa.uffs.edu.br/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S', school_url: 'https://www.uffs.edu.br/' },
  { sno: 99, name: 'Universidade Federal da Integração Latino-Americana', acronym: 'UNILA', region: 'Sul', state: 'Paraná', type: 'Federal', sigaa_url: 'https://sig.unila.edu.br/sigaa/public/processo_seletivo/lista.jsf?nivel=S&aba=p-stricto', school_url: 'https://www.unila.edu.br' },
  { sno: 100, name: 'Universidade Federal de Ciências da Saúde de Porto Alegre', acronym: 'UFCSPA', region: 'Sul', state: 'Rio Grande do Sul', type: 'Federal', sigaa_url: 'https://processoseletivo.ufcspa.edu.br/menu/', school_url: 'https://ufcspa.edu.br/' },
  { sno: 101, name: 'Universidade Federal de Pelotas', acronym: 'UFPel', region: 'Sul', state: 'Rio Grande do Sul', type: 'Federal', sigaa_url: 'https://wp.ufpel.edu.br/prppg/editais-da-pos-graduacao/', school_url: 'https://portal.ufpel.edu.br/' },
  { sno: 102, name: 'Universidade Federal de Santa Catarina', acronym: 'UFSC', region: 'Sul', state: 'Santa Catarina', type: 'Federal', sigaa_url: 'https://ppg.ufsc.br/', school_url: 'https://ufsc.br/' },
  { sno: 103, name: 'Universidade Federal de Santa Maria', acronym: 'UFSM', region: 'Sul', state: 'Rio Grande do Sul', type: 'Federal', sigaa_url: 'https://www.ufsm.br/pro-reitorias/prpgp/mestrado-doutorado', school_url: 'https://www.ufsm.br/' },
  { sno: 104, name: 'Universidade Federal do Pampa', acronym: 'UNIPAMPA', region: 'Sul', state: 'Rio Grande do Sul', type: 'Federal', sigaa_url: 'https://sites.unipampa.edu.br/posgraduacao/editais/processos-seletivos-stricto-sensu/editais_andamento_stricto/', school_url: 'https://unipampa.edu.br/portal' },
  { sno: 105, name: 'Universidade Federal do Paraná', acronym: 'UFPR', region: 'Sul', state: 'Paraná', type: 'Federal', sigaa_url: 'https://www.prppg.ufpr.br/site/pos-graduacao/', school_url: 'https://ufpr.br/' },
  { sno: 106, name: 'Universidade Federal do Rio Grande', acronym: 'FURG', region: 'Sul', state: 'Rio Grande do Sul', type: 'Federal', sigaa_url: 'https://coperse.furg.br/', school_url: 'https://www.furg.br/' },
  { sno: 107, name: 'Universidade Federal do Rio Grande do Sul', acronym: 'UFRGS', region: 'Sul', state: 'Rio Grande do Sul', type: 'Federal', sigaa_url: 'https://www.ufrgs.br/propg/', school_url: 'https://www.ufrgs.br/' },
  { sno: 108, name: 'Universidade Tecnológica Federal do Paraná', acronym: 'UTFPR', region: 'Sul', state: 'Paraná', type: 'Federal', sigaa_url: 'https://www.utfpr.edu.br/cursos/coordenacoes/stricto-sensu', school_url: 'https://www.utfpr.edu.br/' },
  { sno: 109, name: 'Universidade do Estado de Santa Catarina', acronym: 'UDESC', region: 'Sul', state: 'Santa Catarina', type: 'State', sigaa_url: 'https://www.udesc.br/proppg', school_url: 'https://www.udesc.br/' },
]

async function seed() {
  console.log(`Seeding ${universities.length} universities...`)

  for (const uni of universities) {
    const { data, error } = await supabase
      .from('universities')
      .upsert(
        { ...uni, lat: null, lng: null, logo_url: null },
        { onConflict: 'sno', ignoreDuplicates: false }
      )
      .select()

    if (error) {
      console.error(`Error inserting ${uni.name}: ${error.message}`)
    } else {
      console.log(`  ✓ ${uni.name} (${uni.acronym})`)
    }
  }

  console.log('Seed complete!')
}

seed().catch(console.error)
