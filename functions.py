
actifs = [
    {"name": "SPY", "rendement": 0.12, "mise_percent": 50},
    {"name": "META", "rendement": 0.15, "mise_percent": 15},
    {"name": "NVDA", "rendement": 0.15, "mise_percent": 15},
    {"name": "BTC", "rendement": 0.7, "mise_percent": 10},
    {"name": "ETH", "rendement": 0.7, "mise_percent": 10}
]


class Investissement:

    def __init__(self,patrimoine, added_by_month, reinvested, actifs):
        self.patrimoine = patrimoine
        self.added_by_month = added_by_month
        self.reinvested = reinvested
        self.actifs = actifs


    def calculate_mise(self):
        for actif in self.actifs:
            actif['mise'] = self.added_by_month * actif['mise_percent'] / 100
        return self.actifs


    def __str__(self):
        return "\nNouveaux Patriomine : " + str(self.patrimoine) + "\n"


def estimate_profit(patrimoine, added_by_month, reinvested, actifs,year=1):
    earned_total = 0
    earned_actifs = {}

    #1 - Calcul des gains mensuels
    for actif in actifs:
        earned_actifs[actif['name']] = actif['mise'] *  ( ( ( ( 1 + (actif['rendement']/12) ) ** (12*year) ) - 1 ) / (actif['rendement']/12) )
        print(f"Vous avez gagné {earned_actifs[actif['name']]} avec {actif['name']}")
        earned_total += earned_actifs[actif['name']]
    print()
    print(f"Vous avez gagné {earned_total} au total")

    #2 - Calcul des gains totaux
    pass

    return earned_total

inv = Investissement(260, 200, 0.7, actifs)

inv.patrimoine += estimate_profit(inv.patrimoine, inv.added_by_month, inv.reinvested, inv.calculate_mise(),year=2)
print(inv)
inv.added_by_month = 1000
inv.patrimoine += estimate_profit(inv.patrimoine, inv.added_by_month, inv.reinvested, inv.calculate_mise(),year=2)
print(inv)
inv.added_by_month = 2000
inv.patrimoine += estimate_profit(inv.patrimoine, inv.added_by_month, inv.reinvested, inv.calculate_mise(),year=2)
print(inv)
inv.added_by_month = 5000
inv.patrimoine += estimate_profit(inv.patrimoine, inv.added_by_month, inv.reinvested, inv.calculate_mise(),year=2)
print(inv)
inv.added_by_month = 10000
inv.patrimoine += estimate_profit(inv.patrimoine, inv.added_by_month, inv.reinvested, inv.calculate_mise(),year=2)

