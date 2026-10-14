# Perfis de identidade visual

## Objetivo
Reorganizar a tela para que o usuário escolha primeiro qual perfil deseja editar ou crie um novo. Haverá um único perfil ativo para toda a organização.

## Fluxo
1. Ao abrir **Identidade visual**, mostrar uma galeria de perfis.
2. Destacar claramente o perfil ativo e separar seu estado de alterações pendentes.
3. Permitir abrir qualquer perfil para edição.
4. Oferecer **Novo perfil** com duas origens:
   - começar a partir do padrão do AuditFlow;
   - usar um perfil existente como base.
5. Se ainda não existir nenhum perfil, iniciar diretamente uma nova configuração baseada no padrão.
6. Dentro do editor, mostrar o perfil atual no topo e uma ação clara para voltar à galeria.
7. **Salvar perfil** preserva as configurações na galeria; **Aplicar à organização** torna aquele perfil o único ativo.

## Escopo desta etapa
- Construir e conectar toda a experiência visual e interativa no navegador.
- Incluir estados com perfis existentes, criação, duplicação, edição, alterações pendentes e perfil ativo.
- Manter as configurações apenas durante a sessão atual; persistência e regras de permissão ficam fora desta etapa.

## Detalhes técnicos
- Reaproveitar o editor e as validações de contraste existentes.
- Modelar a biblioteca de perfis como estado local da tela.
- Usar diálogos para nomear e escolher a base de um novo perfil.
- Ajustar os textos de rascunho/publicação para o novo modelo de perfis.
- Preservar o comportamento responsivo e a prévia clara/escura.
