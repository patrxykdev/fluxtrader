import os
from polygon import RESTClient
from datetime import datetime
import pandas as pd
import yfinance as yf  # Add yfinance as fallback
from alpha_vantage.timeseries import TimeSeries
import numpy as np

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import generics

from django.contrib.auth.models import User
from .models import Strategy
from .serializers import UserSerializer, StrategySerializer
from .backtester import run_backtest

def fetch_data_from_polygon(ticker, start_date, end_date, timeframe):
    """Fetch data from Polygon.io"""
    api_key = os.environ.get("POLYGON_API_KEY")
    if not api_key:
        raise ValueError("Polygon API key not configured")
    
    client = RESTClient(api_key)
    
    # Map frontend timeframe to Polygon's 'timespan'
    timespan_map = {'5m': 'minute', '15m': 'minute', '1h': 'hour', '1d': 'day'}
    multiplier_map = {'5m': 5, '15m': 15, '1h': 1, '1d': 1}
    
    # Handle crypto tickers for Polygon
    polygon_ticker = ticker.upper()
    if ticker.endswith('USD') and len(ticker) > 3:  # Crypto ticker
        polygon_ticker = f"X:{ticker.upper()}"  # Polygon crypto format
    
    aggs = client.get_aggs(
        ticker=polygon_ticker,
        multiplier=multiplier_map.get(timeframe, 1),
        timespan=timespan_map.get(timeframe, 'day'),
        from_=start_date,
        to=end_date,
        limit=50000
    )
    
    if not aggs:
        raise ValueError(f"No data found for {ticker}")
    
    # Convert to DataFrame
    data = pd.DataFrame(aggs)
    data['time'] = pd.to_datetime(data['timestamp'], unit='ms')
    data.set_index('time', inplace=True)
    
    # Standardize column names
    column_mapping = {
        'o': 'Open', 'h': 'High', 'l': 'Low', 'c': 'Close', 'v': 'Volume',
        'open': 'Open', 'high': 'High', 'low': 'Low', 'close': 'Close', 'volume': 'Volume',
        'O': 'Open', 'H': 'High', 'L': 'Low', 'C': 'Close', 'V': 'Volume'
    }
    
    existing_columns = list(data.columns)
    for old_col, new_col in column_mapping.items():
        if old_col in existing_columns:
            data.rename(columns={old_col: new_col}, inplace=True)
    
    # Keep only the required OHLCV columns
    required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
    available_columns = [col for col in required_columns if col in data.columns]
    
    if len(available_columns) < 5:
        raise ValueError(f"Missing required columns. Available: {available_columns}, Required: {required_columns}")
    
    # Select only the required columns
    data = data[available_columns]
    
    # Add data range info
    data_range_info = {
        'requested_start': start_date,
        'requested_end': end_date,
        'actual_start': data.index.min().strftime('%Y-%m-%d'),
        'actual_end': data.index.max().strftime('%Y-%m-%d'),
        'data_points': len(data),
        'source': 'polygon'
    }
    
    return data, data_range_info

def fetch_data_from_alpha_vantage(ticker, start_date, end_date, timeframe):
    """Fetch data from Alpha Vantage"""
    try:
        api_key = os.environ.get("ALPHA_VANTAGE_API_KEY")
        if not api_key:
            raise ValueError("Alpha Vantage API key not configured")
        
        ts = TimeSeries(key=api_key, output_format='pandas')
        
        # Handle crypto tickers for Alpha Vantage
        alpha_ticker = ticker
        if ticker.endswith('USD') and len(ticker) > 3:  # Crypto ticker
            alpha_ticker = f"{ticker}"  # Alpha Vantage crypto format
        
        # Map timeframe to Alpha Vantage function
        if timeframe == '1d':
            # Get daily data
            data, meta_data = ts.get_daily(symbol=alpha_ticker, outputsize='full')
        elif timeframe in ['5m', '15m', '1h']:
            # Get intraday data (Alpha Vantage has 1min, 5min, 15min, 30min, 60min)
            interval_map = {'5m': '5min', '15m': '15min', '1h': '60min'}
            interval = interval_map.get(timeframe, '60min')
            data, meta_data = ts.get_intraday(symbol=alpha_ticker, interval=interval, outputsize='full')
        else:
            raise ValueError(f"Unsupported timeframe for Alpha Vantage: {timeframe}")
        
        if data.empty:
            raise ValueError(f"No data found for {ticker}")
        
        # Standardize Alpha Vantage columns to Open, High, Low, Close, Volume
        av_column_mapping = {
            '1. open': 'Open',
            '2. high': 'High',
            '3. low': 'Low',
            '4. close': 'Close',
            '5. volume': 'Volume',
            'open': 'Open', 'high': 'High', 'low': 'Low', 'close': 'Close', 'volume': 'Volume'
        }
        data.rename(columns=av_column_mapping, inplace=True)
        
        # Alpha Vantage returns data in reverse chronological order (newest first)
        # Sort to chronological order (oldest first) for proper backtesting
        data = data.sort_index()
        
        # Filter by date range
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        data = data[(data.index >= start_dt) & (data.index <= end_dt)]
        
        if data.empty:
            raise ValueError(f"No data found for {ticker} in the specified date range")
        
        # Add data range info
        data_range_info = {
            'requested_start': start_date,
            'requested_end': end_date,
            'actual_start': data.index.min().strftime('%Y-%m-%d'),
            'actual_end': data.index.max().strftime('%Y-%m-%d'),
            'data_points': len(data),
            'source': 'alpha_vantage'
        }
        
        return data, data_range_info
        
    except Exception as e:
        raise ValueError(f"Alpha Vantage error: {str(e)}")

def fetch_data_from_yfinance(ticker, start_date, end_date, timeframe):
    """Fetch data from yfinance as primary source"""
    try:
        # Handle crypto tickers for yfinance
        yfinance_ticker = ticker
        if ticker.endswith('USD') and len(ticker) > 3:  # Crypto ticker
            yfinance_ticker = f"{ticker}-USD"  # yfinance crypto format
        
        # Download data from yfinance
        ticker_obj = yf.Ticker(yfinance_ticker)
        
        # Map timeframe to yfinance interval
        # Frontend sends: '5m', '15m', '1h', '1d'
        # yfinance expects: '5m', '15m', '1h', '1d'
        interval_map = {'5m': '5m', '15m': '15m', '1h': '1h', '1d': '1d'}
        interval = interval_map.get(timeframe, '1d')
        
        print(f"yfinance: Using interval '{interval}' for timeframe '{timeframe}'")
        
        # For intraday data, we need to limit the period
        if timeframe in ['5m', '15m', '1h']:
            # yfinance has limits for intraday data
            data = ticker_obj.history(period="60d", interval=interval)
        else:
            # For daily data, yfinance can handle much longer periods
            # Convert dates to datetime for better handling
            start_dt = pd.to_datetime(start_date)
            end_dt = pd.to_datetime(end_date)
            
            # yfinance can handle very long periods, up to decades
            data = ticker_obj.history(start=start_dt, end=end_dt, interval=interval)
        
        if data.empty:
            raise ValueError(f"No data found for {ticker}")
        
        # yfinance already has the correct column names (Open, High, Low, Close, Volume)
        
        # Add data range info
        data_range_info = {
            'requested_start': start_date,
            'requested_end': end_date,
            'actual_start': data.index.min().strftime('%Y-%m-%d'),
            'actual_end': data.index.max().strftime('%Y-%m-%d'),
            'data_points': len(data),
            'source': 'yfinance'
        }
        
        return data, data_range_info
        
    except Exception as e:
        raise ValueError(f"yfinance error: {str(e)}")

def fetch_market_data(ticker, start_date, end_date, timeframe):
    """Fetch market data with multiple sources: yfinance > Polygon > Alpha Vantage"""
    errors = []
    
    # Try yfinance first (best historical data coverage, free, no API key required)
    try:
        print(f"Attempting to fetch data from yfinance for {ticker}")
        data, data_range_info = fetch_data_from_yfinance(ticker, start_date, end_date, timeframe)
        print(f"Successfully fetched data from yfinance: {data.shape}")
        return data, data_range_info
    except Exception as e:
        error_msg = f"yfinance failed: {str(e)}"
        print(error_msg)
        errors.append(error_msg)
    
    # Try Polygon second (professional-grade, reliable when API key is configured)
    try:
        print(f"Attempting to fetch data from Polygon for {ticker}")
        data, data_range_info = fetch_data_from_polygon(ticker, start_date, end_date, timeframe)
        print(f"Successfully fetched data from Polygon: {data.shape}")
        return data, data_range_info
    except Exception as e:
        error_msg = f"Polygon failed: {str(e)}"
        print(error_msg)
        errors.append(error_msg)
    
    # Fallback to Alpha Vantage (reliable, good historical data, free tier)
    try:
        print(f"Attempting to fetch data from Alpha Vantage for {ticker}")
        data, data_range_info = fetch_data_from_alpha_vantage(ticker, start_date, end_date, timeframe)
        print(f"Successfully fetched data from Alpha Vantage: {data.shape}")
        return data, data_range_info
    except Exception as e:
        error_msg = f"Alpha Vantage failed: {str(e)}"
        print(error_msg)
        errors.append(error_msg)
    
    # If all failed
    raise ValueError(f"All data sources failed. Errors: {'; '.join(errors)}")

# ... (The rest of your views: RegisterView, ProfileView, StrategyViewSet, etc.) ...


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            "user": serializer.data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

# api/views.py (add this new class)

class ProfileView(APIView):
    permission_classes = (IsAuthenticated,) # This is the key part!

    def get(self, request):
        # The user is available via request.user thanks to JWTAuthentication
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    

class StrategyViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows a user's strategies to be viewed,
    created, updated, or deleted.
    """
    serializer_class = StrategySerializer
    permission_classes = [IsAuthenticated] # Ensures only logged-in users can access

    def get_queryset(self):
        """
        This view should return a list of all the strategies
        for the currently authenticated user.
        """
        return Strategy.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Automatically associate the strategy with the logged-in user upon creation.
        """
        serializer.save(user=self.request.user)


class BacktestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            strategy_id = request.data.get('strategy_id')
            ticker = request.data.get('ticker', 'AAPL')
            start_date = request.data.get('start_date', '2022-01-01')
            end_date = request.data.get('end_date', '2023-01-01')
            timeframe = request.data.get('timeframe', 'day') # Polygon uses 'day', 'hour', 'minute'
            cash = int(request.data.get('cash', 10000))
            leverage = float(request.data.get('leverage', 1.0))

            # Validate inputs
            if not strategy_id:
                return Response({"error": "Strategy ID is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            if cash <= 0:
                return Response({"error": "Initial cash must be positive."}, status=status.HTTP_400_BAD_REQUEST)
            
            if leverage < 1.0 or leverage > 10.0:
                return Response({"error": "Leverage must be between 1x and 10x."}, status=status.HTTP_400_BAD_REQUEST)
            
            if not ticker or not ticker.strip():
                return Response({"error": "Ticker symbol is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                strategy = Strategy.objects.get(id=strategy_id, user=request.user)
            except Strategy.DoesNotExist:
                return Response({"error": "Strategy not found."}, status=status.HTTP_404_NOT_FOUND)

            # --- DATA FETCHING WITH FALLBACK STRATEGY ---
            try:
                data, data_range_info = fetch_market_data(ticker, start_date, end_date, timeframe)
                
                # Debug: Print the actual columns we received
                print(f"Debug: Data columns: {list(data.columns)}")
                print(f"Debug: Data shape: {data.shape}")
                print(f"Debug: Sample data:\n{data.head()}")
                print(f"Debug: Data source: {data_range_info.get('source', 'unknown')}")
                
                # Check if we have the required 'Close' column
                if 'Close' not in data.columns:
                    available_columns = list(data.columns)
                    return Response({
                        "error": f"Data format error: 'Close' column not found. Available columns: {available_columns}. Please check your data source."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Ensure we have all required columns
                required_columns = ['Open', 'High', 'Low', 'Close', 'Volume']
                missing_columns = [col for col in required_columns if col not in data.columns]
                if missing_columns:
                    return Response({
                        "error": f"Missing required columns: {missing_columns}. Available columns: {list(data.columns)}"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Validate data quality
                if data.empty:
                    return Response({"error": f"No valid data found for {ticker} in the specified date range."}, status=status.HTTP_400_BAD_REQUEST)
                
                if len(data) < 30:  # Need at least 30 data points for indicators
                    return Response({"error": f"Insufficient data for {ticker}. Need at least 30 data points, got {len(data)}."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if the requested date range matches the available data range
                requested_start = pd.to_datetime(start_date)
                requested_end = pd.to_datetime(end_date)
                actual_start = pd.to_datetime(data_range_info['actual_start'])
                actual_end = pd.to_datetime(data_range_info['actual_end'])

                # Calculate the coverage of the requested range
                requested_days = (requested_end - requested_start).days
                actual_days = (actual_end - actual_start).days
                
                # Debug logging
                print(f"Debug: Requested range: {start_date} to {end_date} ({requested_days} days)")
                print(f"Debug: Actual data range: {data_range_info['actual_start']} to {data_range_info['actual_end']} ({actual_days} days)")
                
                # Calculate what percentage of the requested range we actually have
                # We'll consider it a full range if we have at least 80% of the requested days
                # and the actual range overlaps significantly with the requested range
                coverage_threshold = 0.8  # 80% coverage
                
                # Check if the actual range significantly overlaps with the requested range
                overlap_start = max(requested_start, actual_start)
                overlap_end = min(requested_end, actual_end)
                overlap_days = max(0, (overlap_end - overlap_start).days)
                
                # Calculate coverage percentage
                coverage_percentage = overlap_days / requested_days if requested_days > 0 else 0
                
                # Debug logging
                print(f"Debug: Overlap: {overlap_start} to {overlap_end} ({overlap_days} days)")
                print(f"Debug: Coverage percentage: {coverage_percentage:.1%}")
                
                # Determine if this is a significant portion of the requested range
                is_significant_coverage = coverage_percentage >= coverage_threshold
                
                # Check if we have limited overlap with the requested range
                # This should be based on overlap, not total actual days
                is_limited_data = overlap_days < (requested_days * 0.5)  # Less than 50% overlap
                
                if is_limited_data or not is_significant_coverage:
                    # Check if there's no overlap at all
                    if overlap_days == 0:
                        message = f"⚠️ No data available for requested range. You requested {start_date} to {end_date}, but data is only available from {data_range_info['actual_start']} to {data_range_info['actual_end']} for {ticker}."
                    else:
                        message = f"⚠️ Limited data available for requested range. You requested {start_date} to {end_date} ({requested_days} days), but only {overlap_days} days overlap with available data from {data_range_info['actual_start']} to {data_range_info['actual_end']} for {ticker}."
                    
                    data_range_message = {
                        'warning': True,
                        'message': message,
                        'requested_range': f"{start_date} to {end_date}",
                        'available_range': f"{data_range_info['actual_start']} to {data_range_info['actual_end']}",
                        'data_points': data_range_info['data_points'],
                        'data_source': data_range_info['source'],
                        'coverage_percentage': round(coverage_percentage * 100, 1),
                        'overlap_days': overlap_days
                    }
                elif coverage_percentage >= 0.95:  # 95% or more coverage
                    data_range_message = {
                        'warning': False,
                        'message': f"✅ Full data range available: {start_date} to {end_date}",
                        'requested_range': f"{start_date} to {end_date}",
                        'available_range': f"{data_range_info['actual_start']} to {data_range_info['actual_end']}",
                        'data_points': data_range_info['data_points'],
                        'data_source': data_range_info['source'],
                        'coverage_percentage': round(coverage_percentage * 100, 1)
                    }
                else:
                    data_range_message = {
                        'warning': False,
                        'message': f"📊 Partial data range available: {data_range_info['actual_start']} to {data_range_info['actual_end']} (requested {start_date} to {end_date})",
                        'requested_range': f"{start_date} to {end_date}",
                        'available_range': f"{data_range_info['actual_start']} to {data_range_info['actual_end']}",
                        'data_points': data_range_info['data_points'],
                        'data_source': data_range_info['source'],
                        'coverage_percentage': round(coverage_percentage * 100, 1)
                    }

            except Exception as e:
                error_msg = str(e)
                if "API key" in error_msg.lower():
                    return Response({"error": "Invalid API key. Please check your Alpha Vantage or Polygon API configuration."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                elif "not found" in error_msg.lower() or "invalid" in error_msg.lower():
                    return Response({"error": f"Invalid ticker symbol: {ticker}. Please check the symbol and try again."}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"error": f"Could not fetch market data from Polygon, yfinance, or Alpha Vantage: {error_msg}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # --- RUN THE BACKTESTING ENGINE ---
            try:
                results = run_backtest(data, strategy.configuration, cash, leverage)
                
                # Check if backtest returned an error
                if 'error' in results:
                    print(f"Error: {results['error']}")
                    return Response({"error": results['error']}, status=status.HTTP_400_BAD_REQUEST)
                
                if 'Equity Final [$]' not in results:
                    print("Warning: 'Equity Final [$]' not found in results. This might indicate no trades were made.")
                    print("Full results:", results)
                else:
                    print(results)
                
                # Add data range information to the response
                results['data_range_info'] = data_range_message
                return Response(results, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({"error": f"An error occurred during the backtest: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DateRangeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get available date range for a ticker"""
        try:
            ticker = request.query_params.get('ticker', '').strip().upper()
            timeframe = request.query_params.get('timeframe', '1d')
            
            if not ticker:
                return Response({"error": "Ticker symbol is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Try to get a sample of data to determine available range
            # Use a wide date range to see what's actually available
            sample_start = '2020-01-01'
            sample_end = datetime.now().strftime('%Y-%m-%d')
            
            try:
                data, data_range_info = fetch_market_data(ticker, sample_start, sample_end, timeframe)
                
                return Response({
                    'ticker': ticker,
                    'timeframe': timeframe,
                    'available_start': data_range_info['actual_start'],
                    'available_end': data_range_info['actual_end'],
                    'data_points': data_range_info['data_points'],
                    'data_source': data_range_info['source'],
                    'message': f"Historical data available for {ticker} from {data_range_info['actual_start']} to {data_range_info['actual_end']} ({data_range_info['data_points']} data points)"
                })
                
            except Exception as e:
                return Response({
                    'ticker': ticker,
                    'timeframe': timeframe,
                    'error': str(e),
                    'message': f"Could not determine available date range for {ticker}. Please check the ticker symbol."
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)