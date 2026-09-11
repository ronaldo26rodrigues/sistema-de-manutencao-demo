from datetime import datetime

from fastapi.testclient import TestClient
from app.main import app, calcular_duracao_min_desde_hora_inicio


def test_calcular_duracao_min_desde_hora_inicio():
    assert calcular_duracao_min_desde_hora_inicio("09:00", datetime(2026, 9, 11, 9, 50)) == 50


def test_import_csv_endpoint_accepts_uploaded_files():
    client = TestClient(app)

    files = {
        'veiculos': ('veiculos.csv', b'prefixo,modelo,chassi_tipo,ano,garagem,km_atual,status\nA1,Toyota Corolla,ABC123,2024,Garagem X,12000,ativo\n'),
        'itenschecklist': ('itenschecklist.csv', b'nome,categoria,criticidade,descricao\nFreio,seguranca,alta,Verifica freio\n'),
        'inspecoes': ('inspecoes.csv', b'veiculo_id,data_inspecao,turno,garagem_id,mecanico_id,km_no_ato,observacoes\n1,2026-09-11,manha,1,USER1,12000,Primeira inspeção\n'),
        'garagens': ('garagens.csv', b'nome,endereco\nGaragem X,Rua A\n'),
    }

    response = client.post('/importar_csv', files=files)
    assert response.status_code == 200
    payload = response.json()
    assert payload['veiculos'] >= 1
    assert payload['itenschecklist'] >= 1
    assert payload['inspecoes'] >= 1
    assert payload['garagens'] >= 1
