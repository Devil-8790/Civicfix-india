import math
import re

def parse_wkt_point(wkt_string: str):
    """Extracts (longitude, latitude) floats from a WKT string."""
    if not wkt_string:
        return None
    match = re.search(r"POINT\(([-\d\.]+) ([-\d\.]+)\)", wkt_string)
    if match:
        return float(match.group(1)), float(match.group(2))
    return None

def calculate_distance(point1_wkt: str, point2_wkt: str) -> float:
    """
    Calculates the 'Haversine' distance in meters between two points.
    Essential for detecting duplicate complaints in the same area.
    """
    p1 = parse_wkt_point(point1_wkt)
    p2 = parse_wkt_point(point2_wkt)
    
    if not p1 or not p2:
        return float('inf')

    lon1, lat1 = p1
    lon2, lat2 = p2

    # Radius of Earth in kilometers
    R = 6371.0 

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance_km = R * c
    return distance_km * 1000 # Convert to meters