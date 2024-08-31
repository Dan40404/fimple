
from rest_framework.views import APIView
from sqlalchemy.sql.functions import current_date
import datetime
from ..models import base_models
from ..models.base_models import Asset, Capital, FimpleUser
from ..serializers import base_serializers
from rest_framework.response import Response
import uuid
from django.contrib.auth.hashers import check_password
import yfinance as yf
    
class Login(APIView):

    #check if the user is logged in from the token

    def get(self, request):

        headers = request.headers

        try:
            token = headers['token']
            assert token != None
            assert uuid.UUID(token)
            assert base_models.FimpleUser.objects.filter(token=token).exists()
        except:
            return Response({'success': False, 'message': "No token provided or invalid token"}, status=200)


        serialized_user = base_serializers.FimpleUserSerializer(base_models.FimpleUser.objects.get(token=token))

        return Response({'success': True, 'user': serialized_user.data}, status=200)


class LoginWithEmail(APIView):

        #log in the user with email and password

        def get(self, request):

            headers = request.headers

            try:
                email = headers['email'].lower()
                password = headers['password']
                assert email != None
                assert password != None
                assert base_models.FimpleUser.objects.filter(email=email).exists()
                user = base_models.FimpleUser.objects.get(email=email)
                user_password_hash = user.password
                assert check_password(password, user_password_hash) or password == user.password
            except:
                return Response({'success': False, 'message': 'Invalid email or password'}, status=200)

            return Response({'success': True, 'message': 'User logged in successfully', 'user': base_serializers.FimpleUserSerializer(user).data}, status=200)


class FinanceView(APIView):


    def get_current_capital(self, wallet):
        curr_cap = 0
        for asset in wallet['assets']:
            if asset['state'] == 'HOLD':
                curr_cap += asset['amount'] * asset['current_price']

        return curr_cap


    def validate_asset_format(self,asset):
        try:
            assert asset != None
            assert type(asset) == dict, "Invalid asset type"
            assert (key in asset.keys() for key in ['id','symbol', 'amount','original_price','state']), "key missing"
            assert len(asset.keys()) == 5, "Invalid number of keys"
            assert type(asset['symbol']) == str, "Invalid symbol type"
            asset['amount'] = float(asset['amount'])
            asset['original_price'] = float(asset['original_price'])
            assert asset['state'] in ['HOLD', 'SOLD'], "Invalid state"
            asset_infos = yf.Ticker(asset['symbol']).info, "Invalid symbol"
            assert asset_infos != None,  "Invalid symbol"  #check if the symbol is valid
        except Exception as e:
            print(e)
            return False, "Invalid asset format"
        return True, asset_infos


    def get_user_wallet(self, token):

        try:
            assert token != None
            assert uuid.UUID(token)
            assert base_models.FimpleUser.objects.filter(token=token).exists()
        except:
            return None

        user = base_models.FimpleUser.objects.get(token=token)
        wallet_serialized = base_serializers.WalletSerializer(user.wallet)

        return wallet_serialized.data



    def get_live_wallet(self, token):

        user_wallet = self.get_user_wallet(token)

        if user_wallet is None:
            return None

        for asset in user_wallet['assets']:
            asset_infos = yf.Ticker(asset['symbol']).info
            asset['short_name'] = asset_infos['shortName'] if "-USD" not in asset['symbol'] else asset_infos['name']
            asset['current_price'] = asset_infos['currentPrice'] if "-USD" not in asset['symbol'] else asset_infos['previousClose']

        last_capital = {"amount": user_wallet['history_capital'][-1]['amount'], "date": user_wallet['history_capital'][-1]['date']}

        # if date is more than 1 day or capital is more has a difference of +-5% with last capital, add the current capital to the history
        last_capital_date = datetime.datetime.strptime(last_capital['date'][0:19], '%Y-%m-%dT%H:%M:%S')
        calculated_capital = self.get_current_capital(user_wallet)

        if (datetime.datetime.now() - last_capital_date).total_seconds() > 86400 or not(last_capital['amount']*1.05 > calculated_capital > last_capital['amount']*0.95):
            # create new capital which will be the last capital of the user wallet
            new_capital = Capital.objects.create(amount=calculated_capital, date=datetime.datetime.now())
            new_capital.save()

            # add the new capital to the user wallet
            user_wallet['history_capital'].append({'amount': new_capital.amount, 'date': new_capital.date})

            # save the user wallet
            user = FimpleUser.objects.get(token=token)
            user.wallet.history_capital.add(new_capital)
            user.wallet.save()

        return user_wallet


    def create_asset(self, token, asset: dict):

        asset_symbol = asset['symbol']
        asset_amount = asset['amount']
        asset_original_price = asset['original_price']
        asset_state = asset['state']

        new_asset = Asset.objects.create(symbol=asset_symbol, amount=asset_amount, original_price=asset_original_price, state=asset_state)
        new_asset.save()

        user = base_models.FimpleUser.objects.get(token=token)
        wallet_assets = list(user.wallet.assets.all())
        wallet_assets.append(new_asset)
        user.wallet.assets.set(wallet_assets)
        user.wallet.save()

        user_wallet = self.get_live_wallet(token)

        return user_wallet


    def remove_asset(self, token, asset_id):

        user = base_models.FimpleUser.objects.get(token=token)

        if user.wallet.assets.filter(id=asset_id).exists():
            asset = Asset.objects.get(id=asset_id)
            user.wallet.assets.remove(asset)
            user.wallet.save()
            asset.delete()

        user_wallet = self.get_live_wallet(token)

        return user_wallet


    def upddate_asset(self, token, asset_id, asset: dict):

        asset_symbol = asset['symbol']
        asset_amount = asset['amount']
        asset_original_price = asset['original_price']
        asset_state = asset['state']

        user = base_models.FimpleUser.objects.get(token=token)

        if user.wallet.assets.filter(id=asset_id).exists():
            asset = Asset.objects.get(id=asset_id)
            asset.symbol = asset_symbol
            asset.amount = asset_amount
            asset.original_price = asset_original_price
            asset.state = asset_state
            asset.save()

        user_wallet = self.get_live_wallet(token)

        return user_wallet


    def get(self, request):

        headers = request.headers

        token = headers['token']
        action = headers['action']

        if action == 'get_wallet':
            return Response({'success': True, 'wallet': self.get_live_wallet(token)}, status=200)

        return Response({'success': False, 'message': "Invalid action provided"}, status=200)


    def post(self, request):

        headers = request.headers

        token = headers['token']
        action = headers['action']

        if action == 'create_asset':
            asset = request.data['asset']
            is_valid, currency = self.validate_asset_format(asset)

            if not is_valid:
                return Response({'success': False, 'message': currency}, status=200)

            return Response({'success': True, 'wallet': self.create_asset(token, asset)}, status=200)

        if action == 'remove_asset':
            asset_id = request.data['asset_id']
            return Response({'success': True, 'wallet': self.remove_asset(token, asset_id)}, status=200)

        if action == 'update_asset':
            asset_id = request.data['asset_id']
            asset = request.data['asset']
            is_valid, currency = self.validate_asset_format(asset)

            if not is_valid:
                return Response({'success': False, 'message': currency}, status=200)

            return Response({'success': True, 'wallet': self.upddate_asset(token, asset_id, asset)}, status=200)

        return Response({'success': False, 'message': "Invalid action provided"}, status=200)


class PredictionView(APIView):


    def validate_data(self, data):
        try:
            assert len(data) == 6, "Invalid number of keys"
            assert type(data['base_capital']) == float or type(data['base_capital']) == int, "Invalid base_capital type"
            assert type(data['assets']) == list, "Invalid assets type"
            assert type(data['reinvestment_rate']) == float or type(data['reinvestment_rate']) == int, "Invalid reinvestment_rate type"
            assert type(data['years']) == int, "Invalid year type"
            assert type(data['mensual_intake']) == float or type(data['mensual_intake']) == int or data['mensual_intake'] is None, "Invalid mensual_intake type"
            assert type(data['mensual_intakes']) == list or data['mensual_intakes'] is None, "Invalid mensual_intakes type"
        except Exception as e:
            return False, e
        return True, None


    def format_assets(self, assets):
        try:
            formatted_assets = []
            for asset in assets:
                formatted_assets.append([int(asset['intake'])/100, int(asset['interest'])/100])
            return formatted_assets
        except:
            return assets

    def calculate_capitale_multiple_mensual(self,reinvestment_rate, mensual_intakes, base_capital, assets, years):
        assets_data = []

        for asset in assets:
            assets_data.append({
                "percentage_invested": asset[0],
                "annual_return": asset[1],
                "mensual_return": asset[1] / 12,
                "base_capital": base_capital * asset[0],
                "mensual_intake": [mensual_intake * asset[0] for mensual_intake in mensual_intakes],
                "profit": 0
            })

        for asset in assets_data:

            for month in range(12 * years):

                if month % 12 == 0:
                    asset["profit"] += asset["base_capital"] * (1 - reinvestment_rate)
                    asset["base_capital"] = asset["base_capital"] * reinvestment_rate

                asset["base_capital"] = asset["base_capital"] * (1 + asset["mensual_return"]) + asset["mensual_intake"][month % 12]

        return sum([asset["base_capital"] + asset["profit"] for asset in assets_data])


    def calculate_capitale(self,reinvestment_rate, mensual_intake, base_capital, assets, years):
        assets_data = []

        for asset in assets:
            assets_data.append({
                "percentage_invested": asset[0],
                "annual_return": asset[1],
                "mensual_return": asset[1] / 12,
                "base_capital": base_capital*asset[0],
                "mensual_intake": mensual_intake*asset[0],
                "profit": 0
            })

        for asset in assets_data:

            for month in range(12*years):

                if month % 12 == 0:
                    asset["profit"] += asset["base_capital"]*(1-reinvestment_rate)
                    asset["base_capital"] = asset["base_capital"]*reinvestment_rate

                asset["base_capital"] = asset["base_capital"]*(1+asset["mensual_return"]) + asset["mensual_intake"]

        return sum([asset["base_capital"] + asset["profit"] for asset in assets_data])


    def predict_calculation(self,base_capitale,assets,reinvestment_rate,year,mensual_intake=None,mensual_intakes=None):

        if mensual_intake is not None:
            return self.calculate_capitale(reinvestment_rate, mensual_intake, base_capitale, assets, year)

        return self.calculate_capitale_multiple_mensual(reinvestment_rate, mensual_intakes, base_capitale, assets, year)


    def post(self, request):

        headers = request.headers

        token = headers['token']

        if not base_models.FimpleUser.objects.filter(token=token).exists():
            return Response({'success': False, 'message': "Invalid token provided"}, status=200)


        if not self.validate_data(request.data)[0]:
            return Response({'success': False, 'message': "Invalid data format", 'error': str(self.validate_data(request.data)[1])}, status=200)

        base_capital = request.data['base_capital']
        assets = request.data['assets']
        assets = self.format_assets(assets)
        reinvestment_rate = float(request.data['reinvestment_rate'])/100
        years = request.data['years']
        mensual_intake = request.data['mensual_intake']
        mensual_intakes = request.data['mensual_intakes']

        print(base_capital, assets, reinvestment_rate, years, mensual_intake, mensual_intakes)

        predictions = []
        for y in range(1, years+1):
            prediction = self.predict_calculation(base_capital, assets, reinvestment_rate, y, mensual_intake, mensual_intakes)
            predictions.append(prediction)

        return Response({'success': True, 'predictions': predictions}, status=200)