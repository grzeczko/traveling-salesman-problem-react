import React, { Component } from 'react'
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom'
import Axios from 'axios';
import shouldPureComponentUpdate from 'react-pure-render/function';

import GoogleMap from 'google-map-react'
import MapMarker from './Map/Marker.jsx'
import Polyline from './Map/Polyline'
import Tsp from '../utils/Tsp.js'

const AnyReactComponent = ({ text }) => <div>{ text }</div>;

export default class Map extends Component {
  constructor (props) {
    super(props)

    this.state = {
      mapsLoaded: false,
      map: null,
      maps: null,
      airports: [],
      bestOrder: [],
      showGeodesicPolyline: true,
      showNonGeodesicPolyline: true
    }
  }

  static propTypes = {
    center: PropTypes.any,
    zoom: PropTypes.number
  }

  static defaultProps = {
    markers: [],
    center: { lat: 40.7446790, lng: -73.9485420 },
    zoom: 1
  }

  //shouldComponentUpdate = shouldPureComponentUpdate;

  componentDidMount() {
    this.fetchAirports();
  }

  fetchAirports = event => {
    Axios.get(`https://skysurf.travel/php/random.php`)
      .then(res => {
        const airports = res.data;

        const tsp = new Tsp();
        const bestOrder = tsp.getShortestRoute(airports);

        this.setState({
          ...this.state,
          airports: airports,
          bestOrder: bestOrder
        });

        this.fitBounds(this.state.map, this.state.maps)
      })
  }

  showPolyline = (line) => {
    this.setState({
      ...this.state,
      [line]: !this.state[line]
    })
  }

  onMapLoaded (map, maps) {
    this.setState({
      ...this.state,
      mapsLoaded: true,
      map: map,
      maps: maps
    })
  }

  fitBounds (map, maps) {
    var bounds = new maps.LatLngBounds()
    for (let airport of this.state.airports) {
      bounds.extend(
        new maps.LatLng(airport.lat, airport.lng)
      )
    }
    map.fitBounds(bounds)
  }

  afterMapLoadChanges () {
    var polylines = [];
    var lastPoints = {};
    var airport = null;
    var airports = this.state.airports;

    { this.state.bestOrder.map((val, i) => {
        airport = airports[val];
        if (i > 0) {
          const markers = [lastPoints, {lat: airport.lat, lng: airport.lng}];

          polylines.push(<div style={{display: 'none'}}>
                 <Polyline
                   key={i}
                   id={i}
                   map={this.state.map}
                   maps={this.state.maps}
                   markers={markers}
                   showGeodesicPolyline={this.state.showGeodesicPolyline}
                   showNonGeodesicPolyline={this.state.showNonGeodesicPolyline} />
             </div>);
        }

        lastPoints = {
          lat: airport.lat,
          lng: airport.lng
        };
    })}

    return (
      <div>
        { polylines }
      </div>
    )
  }

  render() {
        const style = {
          width: '100%',
          height: '80vh',
          margin: '0 auto'
        }
        return this.state.airports.length
                ? (
                  <React.Fragment>
                    <div style={style} className='google-map'>
                      <GoogleMap
                        //bootstrapURLKeys={{ key:'AIzaSyD-x50hgRfdXc3c8683x3Pv1KJIQC45DqM' }}
                        yesIWantToUseGoogleMapApiInternals={true}
                        defaultCenter={ this.props.center }
                        defaultZoom={ this.props.zoom }
                        onGoogleApiLoaded={({map, maps}) => this.onMapLoaded(map, maps)}>
                        <AnyReactComponent
                          lat={ 52.229 }
                          lng={ 21.012 }
                          text={ 'Traveling Salesman Problem' }
                        />
                        { this.state.airports.map((airport, i) => <MapMarker key={i} lat={airport.lat} lng={airport.lng} text={airport.iata} />) }
                        { this.state.mapsLoaded ? this.afterMapLoadChanges() : '' }
                      </GoogleMap>
                    </div>
                    <div className='refresh-button'>
                      <button style={{margin: '20px'}} className='btn btn-primary' onClick={this.fetchAirports}>Refresh Map</button>
                      <label style={{padding: '0 20px'}} for="showGeodesicPolyline">
                        <input onClick={() => this.showPolyline("showGeodesicPolyline")}
                               id="showGeodesicPolyline"
                               type="checkbox"
                               checked={this.state.showGeodesicPolyline}
                               /> Show Geodesic Polyline
                        </label>
                      <label style={{padding: '0 20px'}} for="showNonGeodesicPolyline">
                        <input onClick={() => this.showPolyline("showNonGeodesicPolyline")}
                               id="showNonGeodesicPolyline"
                               type="checkbox"
                               checked={this.state.showNonGeodesicPolyline}
                               /> Show NonGeodesic Polyline
                      </label>
                      <div>JSON Data: <pre>{JSON.stringify(this.state.airports, null, 2) }</pre></div>
                    </div>
                  </React.Fragment>
                ) : null;
    }
}
