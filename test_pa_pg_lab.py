"""
Testes automáticos do PA & PG LAB (Etapa 4).

Cada teste compara o resultado do programa (gerado termo a termo, com laço)
com a verificação matemática feita pelas fórmulas:
    PA: an = a1 + (n-1)·r        Sn = (a1 + an)·n / 2
    PG: an = a1 · q^(n-1)        Sn = a1·(q^n - 1) / (q - 1)

Execute com:  py -m unittest test_pa_pg_lab.py -v
"""
import unittest

from pa_pg_lab import alcancar_meta, gerar_pa, gerar_pg


def verifica_pa(a1, r, n):
    an = a1 + (n - 1) * r
    return an, (a1 + an) * n / 2


def verifica_pg(a1, q, n):
    an = a1 * q ** (n - 1)
    sn = a1 * n if q == 1 else a1 * (q ** n - 1) / (q - 1)
    return an, sn


class TestesObrigatorios(unittest.TestCase):
    def test_1_pa_crescente(self):
        termos, soma = gerar_pa(2, 4, 8)
        self.assertEqual(termos, [2, 6, 10, 14, 18, 22, 26, 30])
        self.assertEqual(soma, 128)
        self.assertEqual((termos[-1], soma), verifica_pa(2, 4, 8))

    def test_2_pa_decrescente(self):
        termos, soma = gerar_pa(50, -7, 6)
        self.assertEqual(termos, [50, 43, 36, 29, 22, 15])
        self.assertEqual(soma, 195)
        self.assertEqual((termos[-1], soma), verifica_pa(50, -7, 6))

    def test_3_pg_crescente(self):
        termos, soma = gerar_pg(3, 2, 7)
        self.assertEqual(termos, [3, 6, 12, 24, 48, 96, 192])
        self.assertEqual(soma, 381)
        self.assertEqual((termos[-1], soma), verifica_pg(3, 2, 7))

    def test_4_pg_decrescente(self):
        termos, soma = gerar_pg(1024, 0.5, 6)
        self.assertEqual(termos, [1024, 512, 256, 128, 64, 32])
        self.assertEqual(soma, 2016)
        self.assertEqual((termos[-1], soma), verifica_pg(1024, 0.5, 6))


class ExemplosDoEnunciado(unittest.TestCase):
    def test_exemplo_pa(self):
        self.assertEqual(gerar_pa(5, 3, 6), ([5, 8, 11, 14, 17, 20], 75))

    def test_exemplo_pg(self):
        self.assertEqual(gerar_pg(2, 3, 5), ([2, 6, 18, 54, 162], 242))

    def test_exemplo_meta(self):
        quantidade, soma, _ = alcancar_meta("PG", 2, 2, 1000)
        self.assertEqual((quantidade, soma), (9, 1022))


class CasosEspeciais(unittest.TestCase):
    def test_meta_pa(self):
        # 1 + 2 + ... + 14 = 105 > 100 (com 13 termos a soma é 91)
        quantidade, soma, _ = alcancar_meta("PA", 1, 1, 100)
        self.assertEqual((quantidade, soma), (14, 105))

    def test_meta_inalcancavel(self):
        # PG com q = 0.5 converge para 2 e nunca passa de 10
        quantidade, _, _ = alcancar_meta("PG", 1, 0.5, 10)
        self.assertIsNone(quantidade)

    def test_um_termo(self):
        self.assertEqual(gerar_pa(7, 100, 1), ([7], 7))


if __name__ == "__main__":
    unittest.main(verbosity=2)
