"""
Muslim Vegukin Bot - Protected Mosque Search API
==================================================
Flask API with rate limiting to protect your valuable mosque database

Database: 350 mosques (+ restaurants/shops later)
Expected usage: 1000 daily users
Rate limit: 200 requests/hour per IP (prevents scraping)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3
from math import radians, cos, sin, asin, sqrt
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for web app access

# ============================================
# RATE LIMITING - PROTECTS YOUR DATA
# ============================================

limiter = Limiter(
    app=app,
    key_func=get_remote_address,  # Track by IP address
    default_limits=["200 per hour"],  # 200 requests per hour per IP
    storage_uri="memory://"  # Use memory storage (simple for free tier)
)

# Custom rate limit messages
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'success': False,
        'error': 'Rate limit exceeded. Please try again later.',
        'retry_after': str(e.description)
    }), 429

# ============================================
# CONFIGURATION
# ============================================

# Database path - UPDATE THIS to your actual database location
DATABASE_PATH = 'data/main_db.sqlite'

# Logging for monitoring (helps detect scrapers)
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('api_usage.log'),  # Saves to file
        logging.StreamHandler()  # Also prints to console
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# DATABASE FUNCTIONS
# ============================================

def get_db_connection():
    """Create database connection"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    r = 6371  # Radius of earth in kilometers
    return c * r

# ============================================
# API ENDPOINTS
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    No rate limit for health checks
    """
    return jsonify({
        'status': 'ok',
        'service': 'Muslim Vegukin Bot API',
        'version': '1.0.0',
        'protection': 'Rate limited (200/hour per IP)'
    })

@app.route('/api/mosques/nearby', methods=['GET'])
@limiter.limit("200 per hour")  # Explicit rate limit
def get_nearby_mosques():
    """
    Get nearby mosques based on user location
    
    Query Parameters:
    - lat: User's latitude (required)
    - lon: User's longitude (required)
    - limit: Number of results (default: 5, max: 10)
    
    Rate Limited: 200 requests per hour per IP
    """
    # Log request for monitoring
    ip = get_remote_address()
    logger.info(f"GET /api/mosques/nearby from IP: {ip}")
    
    try:
        # Get and validate parameters
        user_lat = float(request.args.get('lat'))
        user_lon = float(request.args.get('lon'))
        limit = min(int(request.args.get('limit', 5)), 10)  # Max 10 results
        
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query mosques (Building_type = 'Masjid' in Uzbek)
        cursor.execute("""
            SELECT 
                City_English,
                Name,
                Actual_address,
                Tel,
                Latitude,
                Longitude,
                KakaoMap_link,
                NaverMap_Link,
                Photo_path,
                Unique_number,
                (SELECT COUNT(*) FROM reviews WHERE reviews.Unique_number = main_db.Unique_number) AS review_count
            FROM main_db
            WHERE Building_type = 'Masjid'
            ORDER BY (
                (Latitude - ?)*(Latitude - ?) + 
                (Longitude - ?)*(Longitude - ?)
            ) ASC
            LIMIT ?
        """, (user_lat, user_lat, user_lon, user_lon, limit))
        
        results = cursor.fetchall()
        conn.close()
        
        # Calculate distances and format response
        mosques = []
        for row in results:
            distance = haversine(user_lat, user_lon, row['Latitude'], row['Longitude'])
            
            mosque = {
                'id': row['Unique_number'],
                'name': row['Name'],
                'city': row['City_English'],
                'address': row['Actual_address'],
                'phone': row['Tel'],
                'distance': round(distance, 2),
                'lat': row['Latitude'],
                'lon': row['Longitude'],
                'kakaoMapUrl': row['KakaoMap_link'],
                'naverMapUrl': row['NaverMap_Link'],
                'photo': row['Photo_path'],
                'reviewCount': row['review_count']
            }
            mosques.append(mosque)
        
        logger.info(f"Returned {len(mosques)} mosques to IP: {ip}")
        
        return jsonify({
            'success': True,
            'count': len(mosques),
            'mosques': mosques
        })
        
    except ValueError:
        logger.warning(f"Invalid coordinates from IP: {ip}")
        return jsonify({
            'success': False,
            'error': 'Invalid coordinates provided'
        }), 400
    except Exception as e:
        logger.error(f"Error in nearby_mosques: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@app.route('/api/mosques/by-address', methods=['GET'])
@limiter.limit("200 per hour")
def get_mosques_by_address():
    """
    Get mosques near a specific address
    Uses Nominatim API for geocoding
    
    Query Parameters:
    - address: Korean address (required)
    - limit: Number of results (default: 5, max: 10)
    
    Rate Limited: 200 requests per hour per IP
    """
    ip = get_remote_address()
    logger.info(f"GET /api/mosques/by-address from IP: {ip}")
    
    try:
        import requests
        
        address = request.args.get('address')
        if not address:
            return jsonify({
                'success': False,
                'error': 'Address parameter is required'
            }), 400
        
        limit = min(int(request.args.get('limit', 5)), 10)
        
        # Geocode the address
        geocode_url = 'https://nominatim.openstreetmap.org/search'
        params = {
            'q': address,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'kr'
        }
        headers = {
            'User-Agent': 'MuslimVegukinBot/1.0'
        }
        
        response = requests.get(geocode_url, params=params, headers=headers, timeout=5)
        geocode_data = response.json()
        
        if not geocode_data:
            logger.warning(f"Address not found: {address} from IP: {ip}")
            return jsonify({
                'success': False,
                'error': 'Address not found. Please use Korean address format.'
            }), 404
        
        lat = float(geocode_data[0]['lat'])
        lon = float(geocode_data[0]['lon'])
        
        # Query nearby mosques (same as nearby endpoint)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                City_English,
                Name,
                Actual_address,
                Tel,
                Latitude,
                Longitude,
                KakaoMap_link,
                NaverMap_Link,
                Photo_path,
                Unique_number,
                (SELECT COUNT(*) FROM reviews WHERE reviews.Unique_number = main_db.Unique_number) AS review_count
            FROM main_db
            WHERE Building_type = 'Masjid'
            ORDER BY (
                (Latitude - ?)*(Latitude - ?) + 
                (Longitude - ?)*(Longitude - ?)
            ) ASC
            LIMIT ?
        """, (lat, lat, lon, lon, limit))
        
        results = cursor.fetchall()
        conn.close()
        
        mosques = []
        for row in results:
            distance = haversine(lat, lon, row['Latitude'], row['Longitude'])
            
            mosque = {
                'id': row['Unique_number'],
                'name': row['Name'],
                'city': row['City_English'],
                'address': row['Actual_address'],
                'phone': row['Tel'],
                'distance': round(distance, 2),
                'lat': row['Latitude'],
                'lon': row['Longitude'],
                'kakaoMapUrl': row['KakaoMap_link'],
                'naverMapUrl': row['NaverMap_Link'],
                'photo': row['Photo_path'],
                'reviewCount': row['review_count']
            }
            mosques.append(mosque)
        
        logger.info(f"Address search '{address}' returned {len(mosques)} mosques to IP: {ip}")
        
        return jsonify({
            'success': True,
            'count': len(mosques),
            'geocoded_location': {
                'lat': lat,
                'lon': lon,
                'display_name': geocode_data[0].get('display_name')
            },
            'mosques': mosques
        })
        
    except Exception as e:
        logger.error(f"Error in address search: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/mosque/<int:mosque_id>', methods=['GET'])
@limiter.limit("200 per hour")
def get_mosque_details(mosque_id):
    """
    Get detailed information about a specific mosque
    
    Parameters:
    - mosque_id: Unique mosque ID
    
    Rate Limited: 200 requests per hour per IP
    """
    ip = get_remote_address()
    logger.info(f"GET /api/mosque/{mosque_id} from IP: {ip}")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get mosque details (Building_type = 'Masjid')
        cursor.execute("""
            SELECT 
                City_English,
                Name,
                Actual_address,
                Tel,
                Latitude,
                Longitude,
                KakaoMap_link,
                NaverMap_Link,
                Photo_path,
                Unique_number
            FROM main_db
            WHERE Unique_number = ? AND Building_type = 'Masjid'
        """, (mosque_id,))
        
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            logger.warning(f"Mosque {mosque_id} not found, requested by IP: {ip}")
            return jsonify({
                'success': False,
                'error': 'Mosque not found'
            }), 404
        
        # Get reviews
        cursor.execute("""
            SELECT Rating, Review_Text, Timestamp, User_ID
            FROM reviews
            WHERE Unique_number = ?
            ORDER BY Timestamp DESC
        """, (mosque_id,))
        
        reviews_data = cursor.fetchall()
        conn.close()
        
        # Format reviews
        reviews = []
        for review in reviews_data:
            reviews.append({
                'rating': review['Rating'],
                'text': review['Review_Text'],
                'timestamp': review['Timestamp'],
                'userId': review['User_ID']
            })
        
        # Calculate average rating
        avg_rating = sum(r['rating'] for r in reviews) / len(reviews) if reviews else 0
        
        mosque = {
            'id': row['Unique_number'],
            'name': row['Name'],
            'city': row['City_English'],
            'address': row['Actual_address'],
            'phone': row['Tel'],
            'lat': row['Latitude'],
            'lon': row['Longitude'],
            'kakaoMapUrl': row['KakaoMap_link'],
            'naverMapUrl': row['NaverMap_Link'],
            'photo': row['Photo_path'],
            'averageRating': round(avg_rating, 1),
            'reviewCount': len(reviews),
            'reviews': reviews
        }
        
        logger.info(f"Returned details for mosque {mosque_id} to IP: {ip}")
        
        return jsonify({
            'success': True,
            'mosque': mosque
        })
        
    except Exception as e:
        logger.error(f"Error getting mosque details: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    Get API usage statistics (for admin monitoring)
    No sensitive data exposed
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Count mosques (Building_type = 'Masjid')
        cursor.execute("SELECT COUNT(*) as count FROM main_db WHERE Building_type='Masjid'")
        mosque_count = cursor.fetchone()['count']
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_mosques': mosque_count,
                'rate_limit': '200 requests/hour per IP',
                'max_results_per_query': 10
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# RUN APPLICATION
# ============================================

if __name__ == '__main__':
    # Check database exists
    if not os.path.exists(DATABASE_PATH):
        print(f"⚠️  WARNING: Database not found at {DATABASE_PATH}")
        print("Please update DATABASE_PATH in the script")
    else:
        print(f"✅ Database found at {DATABASE_PATH}")
    
    print("\n" + "="*60)
    print("🕌 Muslim Vegukin Bot API - Protected Version")
    print("="*60)
    print("\n📊 Configuration:")
    print(f"  • Rate Limit: 200 requests/hour per IP")
    print(f"  • Max Results: 10 mosques per query")
    print(f"  • Database: {DATABASE_PATH}")
    print(f"  • Logging: api_usage.log")
    print("\n🔒 Data Protection:")
    print(f"  • Database file NOT exposed to users")
    print(f"  • Only query results returned")
    print(f"  • Rate limiting prevents mass scraping")
    print(f"  • All requests logged for monitoring")
    print("\n📍 Endpoints:")
    print("  • GET /api/health")
    print("  • GET /api/mosques/nearby?lat=X&lon=Y&limit=5")
    print("  • GET /api/mosques/by-address?address=서울시&limit=5")
    print("  • GET /api/mosque/<id>")
    print("  • GET /api/stats")
    print("\n🚀 Starting server...")
    print("="*60 + "\n")
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)