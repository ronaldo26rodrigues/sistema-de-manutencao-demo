

import csv
import io
from datetime import date
from typing import Iterable
from datetime import datetime
from fastapi import Depends, FastAPI, HTTPException, HTTPException, UploadFile, File
from sqlmodel import Session
from database import (
    Categoria,
    Criticidade,
    Garagem,
    GaragemCreate,
    GaragemResponse,
    Inspecoes,
    InspecoesCreate,
    InspecoesResponse,
    ItemChecklist,
    ItemChecklistCreate,
    ItemChecklistResponse,
    ItemInspecao,
    ItemInspecaoCreate,
    ItemInspecaoResponse,
    ItemInspecaoUpdate,
    OrdemServico,
    OrdemServicoCreate,
    OrdemServicoResponse,
    OrdemServicoStatus,
    Resultado,
    Status,
    StatusInspecao,
    Turno,
    Veiculo,
    VeiculoCreate,
    VeiculoResponse,
    get_db,
)

from database import VeiculoResponse

from fastapi import FastAPI


def build_nao_conforme_side_effects(item, checklist, inspecao, veiculo):
    """Return the side-effect contract for a nao_conforme item update."""
    actions = {
        "create_os": False,
        "os_status": None,
        "veiculo_status": None,
    }

    if not item or getattr(item, "resultado", None) != Resultado.nao_conforme:
        return actions

    actions["create_os"] = True
    actions["os_status"] = OrdemServicoStatus.aberta

    if checklist and getattr(checklist, "criticidade", None) == Criticidade.alta and veiculo:
        actions["veiculo_status"] = Status.inativo

    return actions


app = FastAPI()
app.frontend("/", directory="../Frontend/case-manutencao/dist")


def status_inspecao_a_partir_dos_itens(itens: list[ItemInspecao]) -> StatusInspecao:
    if not itens:
        return StatusInspecao.pendente

    if all(item.feito for item in itens):
        return StatusInspecao.concluida

    if any(item.feito for item in itens):
        return StatusInspecao.em_andamento

    return StatusInspecao.pendente


def inspeccao_completa_sem_nao_conformidade(itens: list[ItemInspecao]) -> bool:
    if not itens:
        return False

    return all(item.feito for item in itens) and all(item.resultado != Resultado.nao_conforme for item in itens)


def calcular_duracao_min_desde_hora_inicio(hora_inicio: str, horario_fim: datetime | None = None) -> int:
    """Calcula a duração em minutos a partir da hora de início informada.

    Se a data/hora de fim não vier no argumento, usa o instante atual do sistema.
    """
    try:
        if not hora_inicio:
            return 0

        inicio = datetime.strptime(hora_inicio, "%H:%M").time()
        fim = (horario_fim or datetime.now()).time()
        delta = (datetime.combine(date.today(), fim) - datetime.combine(date.today(), inicio)).total_seconds()
        return max(0, int(delta // 60))
    except Exception:
        return 0


async def importar_garagens_csv(content: bytes, db: Session) -> int:
    text = content.decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)))

    for row in rows:
        try:
            db_garagem = Garagem(
                nome=row.get("nome") or "",
                endereco=row.get("endereco") or "",
            )
            db.add(db_garagem)
        except Exception:
            raise HTTPException(status_code=400, detail="Arquivo de garagens com colunas ou valores inválidos")

    db.commit()
    return len(rows)


async def importar_veiculos_csv(content: bytes, db: Session) -> int:
    text = content.decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)))

    for row in rows:
        try:
            db_veiculo = Veiculo(
                prefixo=row.get("prefixo") or "",
                modelo=row.get("modelo") or None,
                chassi_tipo=row.get("chassi_tipo") or "",
                ano=row.get("ano") or "",
                garagem=row.get("garagem") or "",
                km_atual=row.get("km_atual") or "",
                status=Status(row.get("status") or Status.ativo.value),
            )
            db.add(db_veiculo)
        except Exception:
            raise HTTPException(status_code=400, detail="Arquivo de veículos com colunas ou valores inválidos")

    db.commit()
    return len(rows)


async def importar_itenschecklist_csv(content: bytes, db: Session) -> int:
    text = content.decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)), )
    print(rows)

    for row in rows:
        try:
            db_item = ItemChecklist(
                nome=row.get("nome") or "",
                categoria=Categoria(row.get("categoria") or Categoria.operacional.value),
                criticidade=Criticidade(row.get("criticidade") or Criticidade.baixa.value),
                descricao=row.get("descricao") or "",
            )
            db.add(db_item)
        except Exception as e:
            print(f"Error processing row: {row}, error: {e}")
            raise HTTPException(status_code=400, detail="Arquivo de itens de checklist com colunas ou valores inválidos")

    db.commit()
    return len(rows)


async def importar_inspecoes_csv(content: bytes, db: Session) -> int:
    text = content.decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)))

    for row in rows:
        try:
            db_inspecao = Inspecoes(
                veiculo_id=int(row.get("veiculo_id") or 0),
                data_inspecao=row.get("data_inspecao") or "",
                turno=Turno(row.get("turno") or Turno.manha.value),
                garagem_id=int(row.get("garagem_id") or 0),
                mecanico_id=row.get("mecanico_id") or "",
                km_no_ato=float(row.get("km_no_ato") or 0),
                observacoes=row.get("observacoes") or None,
            )
            db.add(db_inspecao)
            db.commit()
            db.refresh(db_inspecao)

            itens_checklist = db.query(ItemChecklist).all()
            for item_checklist in itens_checklist:
                db_item_inspecao = ItemInspecao(
                    inspecao_id=db_inspecao.id,
                    item_checklist_id=item_checklist.id,
                    resultado=Resultado.conforme,
                    feito=False,
                    hora_inicio="",
                    duracao_min=0,
                    observacoes=None,
                )
                db.add(db_item_inspecao)

            db.commit()
        except Exception:
            raise HTTPException(status_code=400, detail="Arquivo de inspeções com colunas ou valores inválidos")

    return len(rows)


@app.post("/importar_csv")
async def importar_csv(
    veiculos: UploadFile = File(default=None),
    itenschecklist: UploadFile = File(default=None),
    inspecoes: UploadFile = File(default=None),
    garagens: UploadFile = File(default=None),
    db: Session = Depends(get_db),
):
    counts = {
        "veiculos": 0,
        "itenschecklist": 0,
        "inspecoes": 0,
        "garagens": 0,
    }

    if veiculos is not None:
        payload = await veiculos.read()
        counts["veiculos"] = await importar_veiculos_csv(payload, db)

    if itenschecklist is not None:
        payload = await itenschecklist.read()
        counts["itenschecklist"] = await importar_itenschecklist_csv(payload, db)

    if inspecoes is not None:
        payload = await inspecoes.read()
        counts["inspecoes"] = await importar_inspecoes_csv(payload, db)

    if garagens is not None:
        payload = await garagens.read()
        counts["garagens"] = await importar_garagens_csv(payload, db)

    if (
        counts["veiculos"] == 0
        and counts["itenschecklist"] == 0
        and counts["inspecoes"] == 0
        and counts["garagens"] == 0
    ):
        raise HTTPException(status_code=400, detail="Envie pelo menos um arquivo CSV válido")

    return counts

@app.post("/veiculos", response_model=VeiculoResponse)
@app.post("/veiculos/", response_model=VeiculoResponse)
async def create_veiculo(veiculo: VeiculoCreate, db: Session = Depends(get_db)):
    db_veiculo = Veiculo(**veiculo.model_dump())
    db.add(db_veiculo)
    db.commit()
    db.refresh(db_veiculo)
    return db_veiculo

@app.get("/veiculos/{veiculo_id}", response_model=VeiculoResponse)
async def read_veiculo(veiculo_id: str, db: Session = Depends(get_db)):
    db_veiculo = db.query(Veiculo).filter(Veiculo.id == veiculo_id).first()
    if db_veiculo is None:
        raise HTTPException(status_code=404, detail="Veículo not found")
    return db_veiculo

@app.get("/veiculos", response_model=list[VeiculoResponse])
async def read_veiculos(db: Session = Depends(get_db)):
    return db.query(Veiculo).all()

@app.post("/garagens/", response_model=GaragemResponse)
@app.post("/garagens", response_model=GaragemResponse)
async def create_garagem(garagem: GaragemCreate, db: Session = Depends(get_db)):
    db_garagem = Garagem(**garagem.model_dump())
    db.add(db_garagem)
    db.commit()
    db.refresh(db_garagem)
    return db_garagem

@app.get("/garagens/{garagem_id}", response_model=GaragemResponse)
async def read_garagem(garagem_id: str, db: Session = Depends(get_db)):
    db_garagem = db.query(Garagem).filter(Garagem.id == garagem_id).first()
    if db_garagem is None:
        raise HTTPException(status_code=404, detail="Garagem not found")
    return db_garagem

@app.get("/garagens", response_model=list[GaragemResponse])
async def read_garagens(db: Session = Depends(get_db)):
    return db.query(Garagem).all()

# create and get by id itenschecklist
@app.post("/itenschecklist/", response_model=ItemChecklistResponse)
async def create_item_checklist(item: ItemChecklistCreate, db: Session = Depends(get_db)):
    db_item = ItemChecklist(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.get("/itenschecklist/{item_id}", response_model=ItemChecklistResponse)
async def read_item_checklist(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(ItemChecklist).filter(ItemChecklist.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@app.get("/itenschecklist", response_model=list[ItemChecklistResponse])
async def read_itenschecklist(db: Session = Depends(get_db)):
    return db.query(ItemChecklist).all()

# create and get by id inspecoes
@app.post("/inspecoes", response_model=InspecoesResponse)
@app.post("/inspecoes/", response_model=InspecoesResponse)
async def create_inspecao(inspecao: InspecoesCreate, db: Session = Depends(get_db)):
    db_inspecao = Inspecoes(**inspecao.model_dump())
    db.add(db_inspecao)
    db.commit()
    db.refresh(db_inspecao)

    veiculo = db.query(Veiculo).filter(Veiculo.id == db_inspecao.veiculo_id).first()
    if veiculo:
        veiculo.status = Status.manutencao
        db.add(veiculo)

    itens_checklist = db.query(ItemChecklist).all()
    for item_checklist in itens_checklist:
        db_item_inspecao = ItemInspecao(
            inspecao_id=db_inspecao.id,
            item_checklist_id=item_checklist.id,
            resultado=Resultado.conforme,
            feito=False,
            hora_inicio="",
            duracao_min=0,
            observacoes=None,
        )
        db.add(db_item_inspecao)

    db.commit()
    return db_inspecao

@app.get("/inspecoes/{inspecao_id}", response_model=InspecoesResponse)
async def read_inspecao(inspecao_id: int, db: Session = Depends(get_db)):
    db_inspecao = db.query(Inspecoes).filter(Inspecoes.id == inspecao_id).first()
    if db_inspecao is None:
        raise HTTPException(status_code=404, detail="Inspeção not found")

    veiculo = db.query(Veiculo).filter(Veiculo.id == db_inspecao.veiculo_id).first()
    itens = db.query(ItemInspecao).filter(ItemInspecao.inspecao_id == db_inspecao.id).all()

    response = {
        "id": db_inspecao.id,
        "veiculo_id": db_inspecao.veiculo_id,
        "veiculo_prefixo": veiculo.prefixo if veiculo else None,
        "status_inspecao": status_inspecao_a_partir_dos_itens(itens),
        "data_inspecao": db_inspecao.data_inspecao,
        "turno": db_inspecao.turno,
        "garagem_id": db_inspecao.garagem_id,
        "mecanico_id": db_inspecao.mecanico_id,
        "km_no_ato": db_inspecao.km_no_ato,
        "observacoes": db_inspecao.observacoes,
        "ordens_servico": []
    }

    ordens = db.query(OrdemServico).filter(OrdemServico.inspecao_id == db_inspecao.id).all()
    response["ordens_servico"] = [
        {
            "id": os.id,
            "veiculo_id": os.veiculo_id,
            "inspecao_id": os.inspecao_id,
            "item_inspecao_id": os.item_inspecao_id,
            "data_abertura": os.data_abertura,
            "data_fechamento": os.data_fechamento,
            "descricao_problema": os.descricao_problema,
            "descricao_servico": os.descricao_servico,
            "status": os.status,
            "item_checklist_id": os.item_checklist_id,
        }
        for os in ordens
    ]

    return response

@app.get("/inspecoes", response_model=list[InspecoesResponse])
async def read_inspecoes(db: Session = Depends(get_db)):
    inspecoes = db.query(Inspecoes).all()
    respostas = []

    for inspecao in inspecoes:
        veiculo = db.query(Veiculo).filter(Veiculo.id == inspecao.veiculo_id).first()
        itens = db.query(ItemInspecao).filter(ItemInspecao.inspecao_id == inspecao.id).all()
        ordens = db.query(OrdemServico).filter(OrdemServico.inspecao_id == inspecao.id).all()
        respostas.append({
            "id": inspecao.id,
            "veiculo_id": inspecao.veiculo_id,
            "veiculo_prefixo": veiculo.prefixo if veiculo else None,
            "status_inspecao": status_inspecao_a_partir_dos_itens(itens),
            "data_inspecao": inspecao.data_inspecao,
            "turno": inspecao.turno,
            "garagem_id": inspecao.garagem_id,
            "mecanico_id": inspecao.mecanico_id,
            "km_no_ato": inspecao.km_no_ato,
            "observacoes": inspecao.observacoes,
            "ordens_servico": [
                {
                    "id": os.id,
                    "veiculo_id": os.veiculo_id,
                    "inspecao_id": os.inspecao_id,
                    "item_inspecao_id": os.item_inspecao_id,
                    "data_abertura": os.data_abertura,
                    "data_fechamento": os.data_fechamento,
                    "descricao_problema": os.descricao_problema,
                    "descricao_servico": os.descricao_servico,
                    "status": os.status,
                    "item_checklist_id": os.item_checklist_id,
                }
                for os in ordens
            ]
        })

    return respostas

# create and get by id ordens_servico
@app.post("/ordens_servico/", response_model=OrdemServicoResponse)
async def create_ordem_servico(ordem: OrdemServicoCreate, db: Session = Depends(get_db)):
    db_ordem = OrdemServico(**ordem.model_dump())
    db.add(db_ordem)
    db.commit()
    db.refresh(db_ordem)
    return db_ordem

@app.get("/ordens_servico", response_model=list[OrdemServicoResponse])
async def read_ordens_servico(db: Session = Depends(get_db)):
    return db.query(OrdemServico).all()

@app.get("/ordens_servico/{ordem_id}", response_model=OrdemServicoResponse)
async def read_ordem_servico(ordem_id: int, db: Session = Depends(get_db)):
    db_ordem = db.query(OrdemServico).filter(OrdemServico.id == ordem_id).first()
    if db_ordem is None:
        raise HTTPException(status_code=404, detail="Ordem de serviço not found")
    return db_ordem

@app.get("/ordens_servico", response_model=list[OrdemServicoResponse])
async def read_ordens_servico(db: Session = Depends(get_db)):
    return db.query(OrdemServico).all()

# itensinpecao
@app.post("/itens_inspecao/", response_model=ItemInspecaoResponse)
async def create_item_inspecao(item: ItemInspecaoCreate, db: Session = Depends(get_db)):
    db_item = ItemInspecao(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item  

@app.get("/itens_inspecao/{item_id}", response_model=ItemInspecaoResponse)
async def read_item_inspecao(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(ItemInspecao).filter(ItemInspecao.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item de inspeção not found")
    return db_item

@app.get("/itens_inspecao", response_model=list[ItemInspecaoResponse])
async def read_itens_inspecao(db: Session = Depends(get_db)):
    return db.query(ItemInspecao).all()

@app.get("/itens_inspecao/inspecao/{inspecao_id}", response_model=list[ItemInspecaoResponse])
async def read_itens_inspecao_por_inspecao(inspecao_id: int, db: Session = Depends(get_db)):
    return db.query(ItemInspecao).filter(ItemInspecao.inspecao_id == inspecao_id).all()

@app.put("/itens_inspecao/{item_id}", response_model=ItemInspecaoResponse)
async def update_item_inspecao(item_id: int, item_update: ItemInspecaoUpdate, db: Session = Depends(get_db)):
    db_item = db.query(ItemInspecao).filter(ItemInspecao.id == item_id).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item de inspeção not found")

    update_payload = item_update.model_dump(exclude_unset=True)

    if update_payload.get("hora_inicio"):
        hora_inicio = update_payload["hora_inicio"]
        duracao_min = calcular_duracao_min_desde_hora_inicio(hora_inicio, datetime.now())
        update_payload["duracao_min"] = duracao_min

    # Apply the user-provided update first and force the server-side duration derivation.
    for campo, valor in update_payload.items():
        setattr(db_item, campo, valor)

    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    # Engine-side side effects only when the item becomes nao_conforme.
    if update_payload.get("resultado") == Resultado.nao_conforme:
        checklist = db.query(ItemChecklist).filter(ItemChecklist.id == db_item.item_checklist_id).first()
        inspecao = db.query(Inspecoes).filter(Inspecoes.id == db_item.inspecao_id).first()
        veiculo = None

        if inspecao:
            veiculo = db.query(Veiculo).filter(Veiculo.id == inspecao.veiculo_id).first()

        # Reuse the helper that encodes the requested side-effect contract.
        actions = build_nao_conforme_side_effects(db_item, checklist, inspecao, veiculo)

        if actions["create_os"]:
            if veiculo:
                db_os = OrdemServico(
                    veiculo_id=veiculo.id,
                    inspecao_id=db_item.inspecao_id,
                    item_inspecao_id=db_item.id,
                    data_abertura=date.today().isoformat(),
                    data_fechamento=None,
                    descricao_problema=(
                        f"Item de inspeção {db_item.id} concluído com resultado nao_conforme. "
                        f"Checklist {checklist.id if checklist else db_item.item_checklist_id}."
                    ),
                    descricao_servico=None,
                    status=actions["os_status"],
                    item_checklist_id=db_item.item_checklist_id,
                )
                db.add(db_os)

        if actions["veiculo_status"] == Status.inativo and veiculo:
            veiculo.status = actions["veiculo_status"]
            db.add(veiculo)

        db.commit()

    # If the inspection reaches the end without any nao_conforme item,
    # the vehicle may return to service as active.
    itens = db.query(ItemInspecao).filter(ItemInspecao.inspecao_id == db_item.inspecao_id).all()
    if inspeccao_completa_sem_nao_conformidade(itens):
        inspecao = db.query(Inspecoes).filter(Inspecoes.id == db_item.inspecao_id).first()
        if inspecao:
            veiculo = db.query(Veiculo).filter(Veiculo.id == inspecao.veiculo_id).first()
            if veiculo:
                veiculo.status = Status.ativo
                db.add(veiculo)
                db.commit()

    return db_item

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)