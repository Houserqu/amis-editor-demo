/**
 * @file entry of this example.
 */
import axios from 'axios';
import React from 'react';
import ReactDom from 'react-dom';
import App from './App';

axios.defaults.baseURL = '/'

export function bootstrap(mountTo: HTMLElement) {
    ReactDom.render(<App />, mountTo);
}
