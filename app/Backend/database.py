import enum
from sqlalchemy import Boolean, Enum, create_engine, Column, Integer, String, Float, ForeignKey
import sqlalchemy
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel

# Database setup
DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = sqlalchemy.orm.declarative_base()



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



class Status(str, enum.Enum):
    ativo = "ativo"
    inativo = "inativo"
    manutencao = "manutencao"
    inspecao = "inspecao"

class StatusInspecao(str, enum.Enum):
    pendente = "pendente"
    em_andamento = "em_andamento"
    concluida = "concluida"

class Veiculo(Base):
    __tablename__ = "veiculo"
    id = Column(Integer, primary_key=True, index=True)
    prefixo = Column(String, index=True)
    modelo = Column(String, index=True)
    chassi_tipo = Column(String)
    ano = Column(String)
    garagem = Column(String)
    km_atual = Column(String)
    status = Column(Enum(Status))

class Categoria(str, enum.Enum):
    seguranca = "seguranca"
    operacional = "operacional"

class Criticidade(str, enum.Enum):
    baixa = "baixa"
    media = "media"
    alta = "alta"

class ItemChecklist(Base):
    __tablename__ = "itemchecklist"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    categoria = Column(Enum(Categoria))
    criticidade = Column(Enum(Criticidade))
    descricao = Column(String)

class Turno(str, enum.Enum):
    manha = "manha"
    tarde = "tarde"
    noite = "noite"

class Garagem(Base):
    __tablename__ = "garagem"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    endereco = Column(String)

class Resultado(str, enum.Enum):
    conforme = "conforme"
    nao_conforme = "nao_conforme"

class Inspecoes(Base):
    __tablename__ = "inspecoes"
    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculo.id"))
    data_inspecao = Column(String)
    turno = Column(Enum(Turno))
    garagem_id = Column(Integer, ForeignKey("garagem.id"))
    mecanico_id = Column(String)
    km_no_ato = Column(Float)
    observacoes = Column(String, nullable=True)

class ItemInspecao(Base):
    __tablename__ = "item_inspecao"
    id = Column(Integer, primary_key=True, index=True)
    inspecao_id = Column(Integer, ForeignKey("inspecoes.id"))
    item_checklist_id = Column(Integer, ForeignKey("itemchecklist.id"))
    resultado = Column(Enum(Resultado))
    feito = Column(Boolean, default=False)
    hora_inicio = Column(String)
    duracao_min = Column(Integer)
    observacoes = Column(String, nullable=True)

class OrdemServicoStatus(str, enum.Enum):
    aberta = "aberta"
    em_andamento = "em_andamento"
    finalizada = "finalizada"
    cancelada = "cancelada"

class OrdemServico(Base):
    __tablename__ = "ordem_servico"
    id = Column(Integer, primary_key=True, index=True)
    veiculo_id = Column(Integer, ForeignKey("veiculo.id"))
    inspecao_id = Column(Integer, ForeignKey("inspecoes.id"), nullable=True)
    item_inspecao_id = Column(Integer, ForeignKey("item_inspecao.id"), nullable=True)
    data_abertura = Column(String)
    data_fechamento = Column(String, nullable=True)
    descricao_problema = Column(String)
    descricao_servico = Column(String, nullable=True)
    status = Column(Enum(OrdemServicoStatus))
    item_checklist_id = Column(Integer, ForeignKey("itemchecklist.id"), nullable=True)

Base.metadata.create_all(bind=engine)

class VeiculoCreate(BaseModel):
    prefixo: str
    modelo: str | None = None
    chassi_tipo: str
    ano: str
    garagem: str
    km_atual: str
    status: Status

class VeiculoResponse(BaseModel):
    id: int
    prefixo: str
    modelo: str | None = None
    chassi_tipo: str
    ano: str
    garagem: str
    km_atual: str
    status: Status

class GaragemCreate(BaseModel):
    nome: str
    endereco: str

class GaragemResponse(BaseModel):
    id: int
    nome: str
    endereco: str

class ItemChecklistCreate(BaseModel):
    nome: str
    categoria: Categoria
    criticidade: Criticidade
    descricao: str

class ItemChecklistResponse(BaseModel):
    id: int
    nome: str
    categoria: Categoria
    criticidade: Criticidade
    descricao: str

class InspecoesCreate(BaseModel):
    veiculo_id: int
    data_inspecao: str
    turno: Turno
    garagem_id: int
    mecanico_id: str
    km_no_ato: float
    observacoes: str | None = None

class InspecoesResponse(BaseModel):
    id: int
    veiculo_id: int
    veiculo_prefixo: str | None = None
    status_inspecao: StatusInspecao | None = None
    data_inspecao: str
    turno: Turno
    garagem_id: int
    mecanico_id: str
    km_no_ato: float
    observacoes: str | None = None
    ordens_servico: list[OrdemServicoResponse] | None = None

class OrdemServicoCreate(BaseModel):
    veiculo_id: int
    inspecao_id: int | None = None
    item_inspecao_id: int | None = None
    data_abertura: str
    data_fechamento: str | None = None
    descricao_problema: str
    descricao_servico: str | None = None
    status: OrdemServicoStatus
    item_checklist_id: int | None = None

class OrdemServicoResponse(BaseModel):
    id: int
    veiculo_id: int
    inspecao_id: int | None = None
    item_inspecao_id: int | None = None
    data_abertura: str
    data_fechamento: str | None = None
    descricao_problema: str
    descricao_servico: str | None = None
    status: OrdemServicoStatus
    item_checklist_id: int | None = None

class ItemInspecaoCreate(BaseModel):
    inspecao_id: int
    item_checklist_id: int
    resultado: Resultado
    feito: bool
    hora_inicio: str
    duracao_min: int
    observacoes: str | None = None

class ItemInspecaoUpdate(BaseModel):
    resultado: Resultado | None = None
    feito: bool | None = None
    hora_inicio: str | None = None
    duracao_min: int | None = None
    observacoes: str | None = None

class ItemInspecaoResponse(BaseModel):
    id: int
    inspecao_id: int
    item_checklist_id: int
    resultado: Resultado
    feito: bool
    hora_inicio: str
    duracao_min: int
    observacoes: str | None = None