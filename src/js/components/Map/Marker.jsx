import React, {Component} from 'react';
import PropTypes from 'prop-types';
import shouldPureComponentUpdate from 'react-pure-render/function';

import {mapMarkerStyles} from './MarkerStyles.js';

export default class MapMarker extends Component {
  static propTypes = {
    text: PropTypes.string
  };

  static defaultProps = {};

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {
    return (
       <div style={mapMarkerStyles}>
          {this.props.text}
       </div>
    );
  }
}
