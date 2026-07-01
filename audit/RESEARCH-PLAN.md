# SAPTM — Plano de Pesquisa UX

> Preparado pelo departamento de UX Research  
> Data: 2026-06-29  
> Metodologia: Entrevistas semi-estruturadas (45-60 min, 5-8 participantes por persona)

---

## 1. Objectivos

1. **Validar proto-personas** — confirmar se os segmentos identificados correspondem a utilizadores reais
2. **Mapear jornadas reais** — como os operadores executam as tarefas hoje (com ou sem SAPTM)
3. **Identificar dores não documentadas** — o que o product audit de 87/100 pode ter perdido
4. **Priorizar funcionalidades** — o que é crítico vs nice-to-have para cada persona

---

## 2. Proto-Personas para Validar

> Referências empíricas: SAP S/4HANA TM business roles (standard SAP Public Cloud) +  
> job descriptions reais de terminais portuários (HHLA Hamburgo, Maersk/APM Terminals, Vopak, Port of Anchorage).

| # | Persona | SAP TM Role (Paralelo) | Cargos Reais Encontrados | Hipotese | Risco |
|---|---------|----------------------|--------------------------|----------|-------|
| P1 | **Operador de Carga** | `SAP_BR_TRANSP_MDSPEC` (Master Data Specialist) | Shipping Specialist (SAP TM/GTT), Terminal Operator | Regista cargas, cria ordens de transporte, gere master data (locais, produtos, UoM). Maior dor: dados inconsistentes entre sistemas | Alto |
| P2 | **Planeador de Transporte** | `SAP_BR_DISPATCHER` | Terminal Planner (HHLA), Vessel/Yard Planner (APM Terminals), Operations Planner (Vopak), Dispatcher OPS (Maersk) | Aloca slots, planeia partidas, coordena operadores. Maior dor: visibilidade em tempo real vs spreadsheets estáticas | Alto |
| P3 | **Gestor de Excepções** | `SAP_BR_FREIGHT_CONTRACTSPEC` / SAP Event Management | Transportation Manager (SAP TM), Port Terminal Operations Manager | Resolve avarias, coordena claims, gere contratos de frete. Maior dor: notificações proactivas vs reactivas | Alto |
| P4 | **Administrador do Sistema** | `SAP_BR_TRANSPORTATION_MGR` (dimensão config) / `SAP_BR_BPC_EXPERT` | Configuration Expert (SAP TM) | Convida membros, atribui roles, configura webhooks, audita. Já tem boa cobertura no product audit | Médio |
| P5 | **Financeiro** | `SAP_BR_TRANSP_BUYER` (Transportation Buyer) / `SAP_BR_FREIGHT_CONTRACTSPEC` | Freight Contract Specialist, Transportation Buyer | Aprova cotações, gere facturação, vê billing. Sem interface actual — validar necessidade real | Baixo |

### Notas sobre a validação empírica

**HHLA (Hamburger Hafen und Logistik AG):**
- Terminal Planner gere planeamento de navios, pátios e caminhos-de-ferro como vista consolidada
- Cobre vessel planning, yard planning, rail planning — não só "carga individual"
- Opera com TOS (Terminal Operating Systems): NAVIS N4, RBS, Kalmar
- Valida directamente P2 (Planeador) mas expande o alcance — não é só alocar slots, é gerir a coreografia portuária completa

**Maersk / APM Terminals:**
- Terminal Planner gere yard utilization, gate, vessel
- Dispatcher OPS faz a ponte entre planeamento e operação no terreno
- Vessel Planner: slot planning, stowage, operações de navio (deck/hatch)
- Valida P3 (Gestor de Excepções) — dispatcher OPS lida com excepções em tempo real

**SAP TM Business Roles (SAP S/4HANA Cloud Public Edition):**
| Código | Role | Alinhamento com Persona |
|--------|------|------------------------|
| `SAP_BR_TRANSP_MDSPEC` | Master Data Specialist (TM) | P1 — base de dados de transporte |
| `SAP_BR_FREIGHT_CONTRACTSPEC` | Freight Contract Specialist | P3, P5 — contratos, claims, frete |
| `SAP_BR_DISPATCHER` | Dispatcher (TM) | P2, P3 — planeamento + excepções |
| `SAP_BR_TRANSPORTATION_MGR` | Transportation Manager | P3, P4 — supervisão + configuração |
| `SAP_BR_TRANSP_BUYER` | Transportation Buyer | P5 — procurement de transporte |
| `SAP_BR_BPC_EXPERT` | Configuration Expert | P4 — setup e manutenção do sistema |

---

## 3. Recrutamento

### Critérios de inclusão
- Utilizador real de software de logística portuária/ferroviária
- Mínimo 6 meses de experiência na função
- Aceita gravação de áudio (para análise posterior)

### Alvos de recrutamento por persona (job titles reais)

| Persona | Job Titles Prioritários | Canais de Contacto |
|---------|------------------------|---------------------|
| P1 — Operador de Carga | Shipping Specialist, Terminal Operator, Master Data Specialist (TM) | LinkedIn (shipping/logistics groups), SAP Community |
| P2 — Planeador | Terminal Planner, Vessel Planner, Yard Planner, Operations Planner, Dispatcher OPS | HHLA, APM Terminals, Vopak — contactos directos, feiras (TOC Europe) |
| P3 — Gestor de Excepções | Transportation Manager (SAP TM), Port Terminal Ops Manager, Freight Contract Specialist | SAP User Groups, port logistics events, LinkedIn |
| P4 — Administrador | Configuration Expert (SAP TM), IT Logistics Specialist, SAP Basis | SAP Community, consultoras SAP (Accenture, Deloitte) |
| P5 — Financeiro | Transportation Buyer, Freight Contract Specialist, Logistics Controller | LinkedIn (procurement/logistics finance), SAP Finance groups |

### Critérios de exclusão
- Envolvido no desenvolvimento do SAPTM
- Relação directa com a equipa de produto

### Meta de recrutamento
- **Mínimo**: 3 participantes por persona (15 total)
- **Ideal**: 5 participantes por persona (25 total)
- **Amostragem**: Bola de neve a partir de 1 contacto inicial por segmento

---

## 4. Guião de Entrevista (45-60 min)

### Abertura (5 min)
```
Olá [nome], obrigado por disponibilizar tempo. Somos a equipa de produto do SAPTM
e estamos a fazer pesquisa para melhorar a plataforma.

Não estamos a testar si — estamos a testar as nossas ideias. Não há respostas certas
ou erradas. Queremos perceber como trabalha no seu dia-a-dia.

Posso gravar o áudio para análise posterior? A gravação não será partilhada fora da
equipa de produto.
```

### Contexto do participante (5 min)
1. Conte-me um pouco sobre o seu papel. O que faz no seu dia-a-dia?
2. Há quanto tempo trabalha nesta área?
3. Quais são as ferramentas que usa diariamente? (ex: Excel, SAP, TMS próprio, email)

### Mapeamento de jornada actual (15 min)
*Para cada tarefa crítica:*

4. Pense no último [registo de carga / planeamento de transporte / resolução de excepção] que fez. Pode descrever passo-a-passo como fez?
5. Quanto tempo demorou? O que foi mais frustrante?
6. Se pudesse mudar uma coisa neste processo, o que seria?
7. Quem mais esteve envolvido? Como comunicaram?

### Exploração de dores (10 min)
8. Qual é a parte mais stressante do seu trabalho?
9. Se pudesse magicamente resolver um problema com software amanhã, qual seria?
10. Já cometeu um erro que teve consequências? O que aconteceu? (sem culpa — entender o sistema)

### Validação de conceitos SAPTM (10 min)
*Mostrar mockups/wireframes se disponíveis — se não, descrever:*

11. Imagine que podia ver [tracking em tempo real / dashboard de excepções / planner de capacidade] sem sair do mesmo ecrã. Faz sentido para si?
12. O que mais lhe importa quando avalia uma ferramenta destas?
13. Já desistiu de usar uma ferramenta porque era demasiado complexa? Porquê?

### Encerramento (5 min)
14. Há mais alguma coisa que gostaria de partilhar?
15. Posso voltar a contactá-lo se tiver mais perguntas?
16. Conhece alguém na sua área que poderia estar interessado em participar?

---

## 5. Análise

### Método
- **Análise temática** (Braun & Clarke): transcrições → codificação aberta → temas → padrões
- **Affinity mapping** pós-entrevistas para consolidar achados

### Outputs esperados
| Output | Descrição | Prazo |
|--------|-----------|-------|
| Proto-personas validadas | Personas actualizadas com quotes reais | 1 semana após última entrevista |
| Jornadas AS-IS | Mapas de jornada actuais (antes do SAPTM ideal) | 2 semanas |
| Opportunity map | Mapa de oportunidades priorizadas por dor/impacto | 2 semanas |
| Recomendações de produto | Feature roadmap v1 baseado em evidência | 3 semanas |

### Métricas de sucesso da pesquisa
- ≥ 80% de tarefas críticas identificadas em ≥ 3 entrevistas por persona
- ≥ 3 oportunidades de alto impacto não documentadas no product audit
- Personas validadas com quotes textuais de utilizadores reais

---

## 6. Timeline Estimada

| Fase | Duração | Marcos |
|------|---------|--------|
| Preparação (guião + recrutamento) | 1 semana | Contactos iniciais feitos |
| Entrevistas (15-25) | 3 semanas | 5-8 entrevistas/semana |
| Análise (temática + affinity) | 2 semanas | Temas consolidados |
| Relatório final | 1 semana | Personas + jornadas + recomendações |
| **Total** | **7 semanas** | |

---

## 7. Riscos

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Dificuldade em recrutar utilizadores reais | Alta | Começar com 1 contacto por segmento; oferecer incentivo |
| Participantes enviesados (feedback positivo) | Média | Estruturar perguntas neutras; pedir exemplos concretos |
| Amostra não representativa (só power users) | Média | Recrutar explicitamente utilizadores casuais |
| Gravação inibe respostas honestas | Baixa | Garantir anonimato; começar sem gravação se necessário |
