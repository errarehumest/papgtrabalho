"""
PA & PG LAB
===========
Programa para gerar e analisar Progressões Aritméticas (PA) e
Progressões Geométricas (PG).

Regra de implementação (Etapa 3):
    Os termos são construídos UM A UM, dentro de uma estrutura de
    repetição. A soma é acumulada durante esse mesmo processo.
    Nenhuma fórmula pronta de termo geral ou de soma é usada para
    produzir os resultados.

Etapa 6 ("Quando a soma atinge a meta?"):
    Dados o primeiro termo, a razão e uma meta, o programa descobre
    quantos termos são necessários para que a soma ULTRAPASSE a meta.
"""

# Limite de segurança para o modo "meta": algumas progressões nunca
# ultrapassam a meta (ex.: PA decrescente ou PG com |q| < 1, que converge).
LIMITE_TERMOS_META = 10_000


# ----------------------------------------------------------------------
# Funções de entrada e formatação
# ----------------------------------------------------------------------
def normalizar(valor):
    """Converte 6.0 -> 6 para que inteiros apareçam sem casas decimais."""
    if isinstance(valor, float):
        valor = round(valor, 10)          # elimina ruído de ponto flutuante
        if valor.is_integer():
            return int(valor)
    return valor


def formatar(valor):
    """Devolve o número como texto, sem '.0' desnecessário."""
    valor = normalizar(valor)
    if isinstance(valor, float):
        return f"{valor:.6f}".rstrip("0").rstrip(".")
    return str(valor)


def ler_numero(mensagem):
    """Lê um número (aceita vírgula ou ponto) até o usuário digitar algo válido."""
    while True:
        texto = input(mensagem).strip().replace(",", ".")
        try:
            return normalizar(float(texto))
        except ValueError:
            print("  Valor inválido. Digite um número (ex.: 3, -2 ou 0.5).")


def ler_inteiro_positivo(mensagem):
    """Lê um inteiro maior ou igual a 1."""
    while True:
        texto = input(mensagem).strip()
        if texto.isdigit() and int(texto) >= 1:
            return int(texto)
        print("  Valor inválido. Digite um número inteiro maior que zero.")


# ----------------------------------------------------------------------
# Geração das progressões (termo a termo, com laço de repetição)
# ----------------------------------------------------------------------
def gerar_pa(primeiro, razao, quantidade):
    """Gera uma PA somando a razão ao termo anterior a cada repetição."""
    termos = []
    soma = 0
    termo = primeiro

    for _ in range(quantidade):
        termos.append(normalizar(termo))
        soma += termo
        termo = termo + razao          # próximo termo da PA

    return termos, normalizar(soma)


def gerar_pg(primeiro, razao, quantidade):
    """Gera uma PG multiplicando o termo anterior pela razão a cada repetição."""
    termos = []
    soma = 0
    termo = primeiro

    for _ in range(quantidade):
        termos.append(normalizar(termo))
        soma += termo
        termo = termo * razao          # próximo termo da PG

    return termos, normalizar(soma)


def proximo_termo(tipo, termo, razao):
    """Decisão central do algoritmo: PA soma a razão, PG multiplica."""
    if tipo == "PA":
        return termo + razao
    return termo * razao


def alcancar_meta(tipo, primeiro, razao, meta):
    """
    Conta quantos termos são necessários para que a soma ultrapasse a meta.

    Retorna (quantidade, soma, termos). Se a meta não for ultrapassada
    dentro do limite de segurança, quantidade vale None.
    """
    termos = []
    soma = 0
    termo = primeiro

    while soma <= meta:
        if len(termos) >= LIMITE_TERMOS_META:
            return None, normalizar(soma), termos
        termos.append(normalizar(termo))
        soma += termo
        termo = proximo_termo(tipo, termo, razao)

    return len(termos), normalizar(soma), termos


# ----------------------------------------------------------------------
# Interface de texto
# ----------------------------------------------------------------------
def mostrar_menu():
    print()
    print("=" * 24)
    print("       PA & PG LAB")
    print("=" * 24)
    print("1 - Progressão Aritmética")
    print("2 - Progressão Geométrica")
    print("3 - Quando a soma atinge a meta?")
    print("0 - Sair")


def executar_progressao(tipo):
    primeiro = ler_numero("Primeiro termo: ")
    razao = ler_numero("Razão: ")
    quantidade = ler_inteiro_positivo("Quantidade de termos: ")

    if tipo == "PA":
        termos, soma = gerar_pa(primeiro, razao, quantidade)
    else:
        termos, soma = gerar_pg(primeiro, razao, quantidade)

    print()
    print(f"{tipo} gerada:")
    print(", ".join(formatar(t) for t in termos))
    print(f"Último termo: {formatar(termos[-1])}")
    print(f"Soma dos termos: {formatar(soma)}")


def executar_meta():
    while True:
        tipo = input("Tipo (PA/PG): ").strip().upper()
        if tipo in ("PA", "PG"):
            break
        print("  Digite PA ou PG.")

    primeiro = ler_numero("Primeiro termo: ")
    razao = ler_numero("Razão: ")
    meta = ler_numero("Meta: ")

    quantidade, soma, termos = alcancar_meta(tipo, primeiro, razao, meta)

    print()
    print("Resultado:")
    if quantidade is None:
        print(f"A soma não ultrapassou a meta em {LIMITE_TERMOS_META} termos.")
        print("Com esses valores, a soma provavelmente nunca ultrapassará a meta.")
        print(f"Soma após {len(termos)} termos: {formatar(soma)}")
    else:
        print(f"São necessários {quantidade} termos.")
        print(f"Soma obtida: {formatar(soma)}")
        if quantidade <= 30:
            print(f"Termos: {', '.join(formatar(t) for t in termos)}")


def main():
    while True:
        mostrar_menu()
        escolha = input("Escolha: ").strip()

        if escolha == "1":
            executar_progressao("PA")
        elif escolha == "2":
            executar_progressao("PG")
        elif escolha == "3":
            executar_meta()
        elif escolha == "0":
            print("Até a próxima!")
            break
        else:
            print("Opção inválida. Escolha 1, 2, 3 ou 0.")


if __name__ == "__main__":
    main()
