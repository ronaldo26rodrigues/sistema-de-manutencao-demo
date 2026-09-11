from app.main import build_nao_conforme_side_effects, status_inspecao_a_partir_dos_itens
from app.database import Criticidade, Resultado, Status, OrdemServicoStatus, StatusInspecao


def test_build_nao_conforme_side_effects_creates_os_and_marks_vehicle_inactive_for_high_criticality():
    item = type('Item', (), {'id': 7, 'resultado': Resultado.nao_conforme})()
    checklist = type('Checklist', (), {'id': 5, 'criticidade': Criticidade.alta})()
    inspecao = type('Inspecao', (), {'id': 12, 'veiculo_id': 3})()
    veiculo = type('Veiculo', (), {'id': 3, 'status': Status.ativo})()

    actions = build_nao_conforme_side_effects(item, checklist, inspecao, veiculo)

    assert actions['create_os'] is True
    assert actions['os_status'] == OrdemServicoStatus.aberta
    assert actions['veiculo_status'] == Status.inativo


def test_status_inspecao_a_partir_dos_itens_retorna_concluida_quando_todos_itens_foram_feitos():
    items = [
        type('Item', (), {'feito': True})(),
        type('Item', (), {'feito': True})(),
        type('Item', (), {'feito': True})(),
    ]

    assert status_inspecao_a_partir_dos_itens(items) == StatusInspecao.concluida
