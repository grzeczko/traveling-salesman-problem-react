import { Component } from 'react'

export default class Polyline extends Component {
  static geodesicPolyline = [];
  static nonGeodesicPolyline = [];

  renderPolylines () {
    const { id, markers, map, maps, showGeodesicPolyline, showNonGeodesicPolyline } = this.props

    /** Example of rendering geodesic polyline */
    if (Polyline.geodesicPolyline[id]) {Polyline.geodesicPolyline[id].setMap(null);}
    if (showGeodesicPolyline) {
      let geodesicPolyline = new maps.Polyline({
        path: markers,
        geodesic: true,
        strokeColor: '#00a1e1',
        strokeOpacity: 1.0,
        strokeWeight: 4
      })
      Polyline.geodesicPolyline[id] = geodesicPolyline;
      Polyline.geodesicPolyline[id].setMap(map)
    }

    /** Example of rendering non geodesic polyline (straight line) */
    if (Polyline.nonGeodesicPolyline[id]) {Polyline.nonGeodesicPolyline[id].setMap(null);}
    if (showNonGeodesicPolyline) {
      let nonGeodesicPolyline = new maps.Polyline({
        path: markers,
        geodesic: false,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeWeight: 3
      })
      Polyline.nonGeodesicPolyline[id] = nonGeodesicPolyline;
      Polyline.nonGeodesicPolyline[id].setMap(map)
    }
  }

  render () {
    this.renderPolylines()
    return null
  }
}
