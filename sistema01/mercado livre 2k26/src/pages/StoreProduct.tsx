import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { createPortal } from "react-dom";
import CrawlerCaptcha from "@/components/CrawlerCaptcha";
import StoreDesktopFooter from "@/components/StoreDesktopFooter";
import { useMascara } from "@/hooks/useMascara";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import type { Product } from "@/contexts/StoreContext";
import { formatCurrency } from "@/utils/formatters";
import { copyToClipboard } from "@/utils/clipboard";

import mobileProductHtml from "@/assets/produto-mobile.html?raw";
import desktopProductHtml from "@/assets/produto-desktop.html?raw";
import productSvgSprites from "@/assets/svg-sprites-product.html?raw";

const DESKTOP_CSS_URLS = [
  "https://http2.mlstatic.com/frontend-assets/shorts-nordic-viewer/videojs.4ff5eea5e00eaf6f87b4.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.19.0/mercadolibre/navigation-desktop.css",
  "https://http2.mlstatic.com/frontend-assets/vpp-frontend/vpp-np.desktop.62f2da0d.css",
];

const PDP_DESKTOP_STYLES = `
@media screen and (min-width: 768px) {
  .andes-dropdown.andes-dropdown--form.andes-form-control--error .andes-floating-menu .andes-dropdown__trigger:focus:not(:focus-visible) {
    box-shadow: inset 0 0 0 2px #f23d4f;
  }

  .andes-dropdown--form.ui-pdp-dropdown-selector.andes-form-control {
    padding-top: 0;
  }
  .andes-dropdown--form.ui-pdp-dropdown-selector.andes-form-control .andes-card__content .andes-list.andes-floating-menu.andes-list--default.andes-list--selectable {
    overflow-x: hidden;
  }
  .andes-dropdown--form.ui-pdp-dropdown-selector.andes-form-control button {
    margin-top: 0;
  }

  .ui-pdp-outside_variations__dropdown {
    width: 100%;
  }
  .ui-pdp-outside_variations__dropdown .andes-list__item--size-medium .andes-list__item-first-column {
    padding: 0;
  }
  .ui-pdp-outside_variations__dropdown .andes-floating-menu--show .andes-card__content .andes-list--default.andes-list--selectable.andes-floating-menu {
    overflow-x: hidden;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form {
    padding-top: 0;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-dropdown__trigger {
    margin: 0;
    height: 48px;
    justify-content: space-between;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-dropdown__trigger span {
    display: flex;
    align-items: center;
    flex-basis: content;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-dropdown__trigger .ui-pdp-outside_variations__dropdown__item--with-picture {
    display: inline-flex;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-dropdown__trigger .ui-pdp-outside_variations__dropdown__item__label--small .ui-pdp-outside_variations__dropdown__item__subtitle {
    width: fit-content;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-floating-menu {
    width: 100%;
    left: 0;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-floating-menu .andes-list__item {
    height: 48px;
    font-size: 18px;
    padding: 14px 8px;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-floating-menu .andes-list__item-text {
    width: 100%;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-floating-menu .andes-list__item-primary {
    display: flex;
    justify-content: space-between;
  }
  .ui-pdp-outside_variations__dropdown.andes-dropdown--form .andes-floating-menu .andes-list__item-secondary {
    position: absolute;
    right: 8px;
    bottom: 16px;
  }
  .ui-pdp-outside_variations__dropdown .andes-dropdown__trigger .ui-pdp-outside_variations__dropdown__item__label,
  .ui-pdp-outside_variations__dropdown .andes-dropdown__trigger .ui-pdp-outside_variations__dropdown__item__subtitle {
    width: fit-content;
  }
  .ui-pdp-outside_variations__dropdown__item {
    display: flex;
    position: relative;
    align-items: center;
  }
  .ui-pdp-outside_variations__dropdown__item--first-column {
    margin-left: 2px;
  }
  .ui-pdp-outside_variations__dropdown__item__label {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    height: 20px;
    max-width: 220px;
    width: 185px;
  }
  .ui-pdp-outside_variations__dropdown__item__label--small {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    height: 20px;
    max-width: 220px;
  }
  .ui-pdp-outside_variations__dropdown__item__subtitle {
    margin-left: 4px;
    height: 20px;
  }
  .ui-pdp-outside_variations__dropdown__item__subtitle::before {
    content: '|';
    margin-right: 4px;
  }
  .ui-pdp-outside_variations__dropdown__item__secondary_text {
    font-size: 12px;
    color: #999;
    line-height: 1.1;
    margin-left: 8px;
    margin-right: 12px;
    max-width: 90px;
    align-items: center;
    text-align: right;
  }
  .ui-pdp-outside_variations__dropdown__item__secondary_text + .ui-pdp-outside_variations__dropdown__item__label {
    padding-right: 80px;
  }
  .ui-pdp-outside_variations__dropdown__item--blocked img {
    opacity: 50%;
  }
  .ui-pdp-outside_variations__dropdown__item--blocked .ui-pdp-outside_variations__dropdown__item__secondary_text {
    top: 3px;
  }
  .ui-pdp-outside_variations__dropdown__item__picture {
    width: 32px;
    height: 32px;
    margin-right: 12px;
  }
  .ui-pdp-outside_variations__dropdown__item__picture + .ui-pdp-outside_variations__dropdown__item__label {
    margin-top: 6px;
  }
  .ui-pdp-outside_variations__dropdown--error .andes-dropdown__trigger {
    border: 1px solid #f23d4f;
    background-color: rgba(0, 0, 0, 0.05);
  }
  .ui-pdp-outside_variations__dropdown--warning .andes-dropdown__trigger {
    border: 1px solid #ff7733;
  }

  .ui-pdp-container__row--outside-variations:has(> .ui-pdp-outside_variations) {
    margin-top: 0;
  }

  .ui-pdp-outside_variations {
    width: 100%;
    margin-top: 25px;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ui-pdp-outside_variations__picker {
    display: flex;
    flex-wrap: wrap;
  }
  .ui-pdp-outside_variations__items {
    margin-top: 8px;
  }

  .ui-pdp-buybox__quantity__input {
    padding: 24px 12px 12px;
    position: relative;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity {
    display: flex;
    padding-top: 16px;
    font-size: 16px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.9);
    width: 100%;
    align-items: flex-start;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity__label {
    display: flex;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity__label .andes-money-amount {
    font-weight: 600;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity__label .andes-money-amount__suffix {
    color: rgba(0, 0, 0, 0.9);
    font-size: 12px;
    margin-left: 0;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity__label-quantity {
    flex: 2;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    line-height: 1.25;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity__label-amount {
    flex: 1;
    justify-content: flex-end;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity__loader-container {
    display: flex;
    align-items: center;
  }
  .ui-pdp-buybox__quantity__input__custom-options-quantity__loader {
    margin-left: 6px;
  }
  .ui-pdp-buybox__quantity__input__custom-options {
    padding: 16px 0 20px;
    width: 100%;
  }
  .ui-pdp-buybox__quantity__input__custom-options .ui-pdp-buybox__quantity__button {
    margin: 0;
    width: 68px;
    height: 34px;
    font-family: 'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.1;
    text-align: center;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-button.ui-pdp-buybox__quantity__button {
    margin: 7px;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-button.ui-pdp-buybox__quantity__button-bulk-custom-options {
    margin: 16px 0 0 0;
    height: 48px;
    font-size: 16px;
    width: 100%;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-form-control--textfield .andes-form-control__field {
    padding-left: 6px;
    padding-right: 0;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-form-control__field::placeholder {
    padding-left: 4px;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-form-control--textfield .andes-form-control__control {
    min-height: 0;
    height: 46px;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-form-control {
    width: 100%;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-button__content {
    top: 0;
    left: 1px;
  }
  .ui-pdp-buybox__quantity__input__custom-options .andes-money-amount__suffix {
    color: rgba(0, 0, 0, 0.9);
    font-size: 12px;
    margin-left: 0;
  }
  .ui-pdp-buybox__quantity__input-textfield .andes-form-control__field {
    width: 100%;
  }
  .ui-pdp-buybox__quantity__input .andes-form-control {
    display: inline-block;
    padding: 0;
  }
  .ui-pdp-buybox__quantity__input .andes-button {
    margin: 8px;
  }
  .ui-pdp-buybox__quantity__input .andes-form-control---error-icon path {
    fill: #fff;
  }
  .ui-pdp-buybox__quantity__input .andes-form-control---error-icon path:first-child {
    fill: #f23d4f;
  }
  .ui-pdp-buybox__quantity__stock {
    font-size: 12px;
    color: #999;
  }
  .ui-pdp-buybox__quantity__disclaimer {
    margin-top: 8px;
  }

  .ui-pdp-buybox__quantity--native {
    height: 50px;
    width: 50px;
    border: 1px solid #ddd;
    border-radius: 4px;
    top: -1px;
    margin-bottom: 10px;
  }
  .ui-pdp-buybox__quantity--native__input {
    padding: 8px;
    width: 100%;
    height: 100%;
    border: 0;
    outline: none;
    border-radius: 4px;
    color: #333;
    font-weight: 600;
  }
  .ui-pdp-buybox__quantity--native__input::placeholder {
    color: #333;
  }
  .ui-pdp-buybox__quantity__lowend__input {
    margin: 12px 0;
  }
  .ui-pdp-buybox__quantity__lowend__input .andes-form-control__field {
    width: 95px;
  }
  .ui-pdp-buybox__quantity__lowend__input .andes-form-control__field::-webkit-inner-spin-button {
    appearance: none;
  }
  .ui-pdp-buybox__quantity__lowend--mobile .andes-form-control__field {
    width: 100%;
  }

  /* Quantity Selector */
  .ui-pdp-quantity-selector {
    border: none;
    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.12);
    padding: 0;
    width: 100%;
  }
  .ui-pdp-quantity-selector__list--default {
    width: 100%;
  }
  .ui-pdp-quantity-selector__list--default-bulk {
    width: 245px;
  }
  .ui-pdp-quantity-selector__list--pdp {
    width: 278px;
  }
  .ui-pdp-quantity-selector__list--vip-core {
    width: 320px;
  }
  .ui-pdp-quantity-selector__list-custom-options .andes-list--selectable li.andes-list__item {
    border-bottom: 1px solid #ededed;
  }
  .ui-pdp-quantity-selector__list-custom-options .andes-list--selectable li:last-of-type {
    border-bottom: 0;
  }
  .ui-pdp-quantity-selector__list-custom-options .andes-money-amount .andes-money-amount__suffix {
    color: rgba(0,0,0,0.9);
    font-size: 12px;
    margin-left: 0;
  }
  .ui-pdp-quantity-selector__list-custom-options .andes-list__item-primary:has(.ui-pdp-quantity-selector__list-custom-options-equivalence) {
    display: flex;
    flex-direction: column;
  }
  .ui-pdp-quantity-selector__list-custom-options.ui-pdp-quantity-selector__list--vip-core {
    width: 100%;
  }
  .ui-pdp-quantity-selector .andes-tooltip-data__arrow {
    display: none;
  }
  .ui-pdp-quantity-selector--volume {
    transform: translateX(-3px);
  }
  .ui-pdp-quantity-selector--options-bulk {
    width: 245px;
  }
  .ui-pdp-quantity-selector--options-bulk .andes-list--dropdown {
    max-height: 310px;
    overflow-y: auto;
  }
  .ui-pdp-quantity-selector--options {
    width: 265px;
  }
  .ui-pdp-quantity-selector--options .andes-list--dropdown {
    max-height: 310px;
    overflow-y: auto;
  }
  .ui-pdp-quantity-selector__options-custom-options {
    margin-top: 4px;
    width: 100%;
    overflow: hidden;
  }
  .ui-pdp-quantity-selector .andes-tooltip-button-close,
  .ui-pdp-quantity-selector .andes-tooltip-arrow {
    display: none;
  }
  .ui-pdp-quantity-selector .andes-list__item {
    align-items: center;
    justify-content: center;
  }
  .ui-pdp-quantity-selector .andes-list__item + .andes-list__item {
    border: none;
  }
  .ui-pdp-quantity-selector .andes-list__item.andes-list__item--selected .andes-list__item-primary {
    font-weight: 600;
    color: #3483fa;
  }
  .ui-pdp-quantity-selector .andes-list__item:first-child {
    border-top-left-radius: 0.25em;
    border-top-right-radius: 0.25em;
  }
  .ui-pdp-quantity-selector .andes-list__item:last-child {
    border-bottom-left-radius: 0.25em;
    border-bottom-right-radius: 0.25em;
    height: auto;
  }
  .ui-pdp-quantity-selector #quantity-list-box > li:has(li[data-testid='quantity-selector-item-more']) {
    padding: 0;
    justify-content: flex-start;
  }
  .ui-pdp-quantity-selector #quantity-list-box > li:has(li[data-testid='quantity-selector-item-more']) > li {
    width: 100%;
  }
  .ui-pdp-quantity-selector #quantity-list-box > li.andes-list__item:not(:last-child) .andes-list__item-primary {
    padding-left: 2px;
  }
  .ui-pdp-quantity-selector #quantity-list-box > li.andes-list__item:not(:last-child) .andes-list__item-first-column {
    margin-right: 10px;
  }

  .andes-list__item-first-column {
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Buybox Quantity */
  .ui-pdp-buybox__quantity {
    color: #333;
    margin-top: 12px;
  }
  .ui-pdp-buybox__quantity__label {
    margin-bottom: 4px;
  }
  .ui-pdp-buybox__quantity__custom-options {
    width: 100%;
    position: relative;
  }
  .ui-pdp-buybox__quantity__custom-options div[data-tippy-root] {
    width: 100%;
  }
  .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__available {
    margin-left: 4px;
    font-size: 16px;
  }
  .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected,
  .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected-error {
    display: flex;
  }
  .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected__label:last-child,
  .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected span,
  .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected-error__label:last-child,
  .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected-error span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ui-pdp-buybox__quantity__title {
    font-size: 14px;
    font-weight: 400;
    color: #333;
  }
  .ui-pdp-buybox__quantity__title--last {
    font-weight: 600;
  }
  .ui-pdp-buybox__quantity__title-error {
    font-size: 14px;
    font-weight: 400;
    color: #f23d4f;
    margin-right: 4px;
  }
  .ui-pdp-buybox__quantity__title-error--last {
    font-weight: 600;
  }
  .ui-pdp-buybox__quantity__selected {
    margin-left: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }
  .ui-pdp-buybox__quantity__selected__label {
    margin-left: 4px;
  }
  .ui-pdp-buybox__quantity__selected-error {
    margin-left: 2px;
    font-size: 14px;
    font-weight: 600;
    color: #f23d4f;
    white-space: nowrap;
  }
  .ui-pdp-buybox__quantity__selected-error span {
    color: #f23d4f;
  }
  .ui-pdp-buybox__quantity__error {
    font-size: 14px;
    font-weight: 600;
    color: #f23d4f;
    white-space: nowrap;
  }
  .ui-pdp-buybox__quantity__chevron {
    margin-left: 4px;
    padding-left: 4px;
    padding-right: 4px;
    vertical-align: bottom;
  }
  .ui-pdp-buybox__quantity__chevron .ui-pdp-icon--chevron {
    height: 11px;
    width: 8px;
  }
  .ui-pdp-buybox__quantity .ui-pdp-icon--disabled {
    stroke: #999;
  }
  .ui-pdp-buybox__quantity .ui-pdp-icon--disabled path {
    stroke: #999 !important;
  }
  .ui-pdp-buybox__quantity__available {
    color: #999;
    font-size: 14px;
    font-weight: 400;
    margin-left: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ui-pdp-buybox__quantity__trigger-bulksale {
    height: fit-content;
    cursor: pointer;
    padding: 0;
  }
  .ui-pdp-buybox__quantity__trigger-bulksale:hover,
  .ui-pdp-buybox__quantity__trigger-bulksale :focus,
  .ui-pdp-buybox__quantity__trigger-bulksale :active {
    background-color: transparent;
  }
  .ui-pdp-buybox__quantity__trigger-bulksale .andes-button__content {
    display: grid;
    max-width: 275px;
    grid-auto-flow: column;
  }
  .ui-pdp-buybox__quantity__trigger-bulksale--options .andes-button__content {
    max-width: 320px;
  }
  .ui-pdp-buybox__quantity__trigger-bulksale--options .andes-button__content .ui-pdp-buybox__quantity__selected__label {
    float: none;
    display: inline;
  }
  .ui-pdp-buybox__quantity__trigger-custom-options {
    min-width: 100%;
    max-width: 275px;
    border-radius: 6px;
    padding: 14px 10px;
  }
  .ui-pdp-buybox__quantity__trigger-custom-options#quantity-selector {
    border: 1px solid #999;
  }
  .ui-pdp-buybox__quantity__trigger-custom-options--active#quantity-selector {
    border: 2px solid #3483fa;
  }
  .ui-pdp-buybox__quantity__trigger-custom-options--error#quantity-selector {
    border: 2px solid #f23d4f;
  }
  .ui-pdp-buybox__quantity__trigger-custom-options .andes-button__content {
    justify-content: flex-start;
  }
  .ui-pdp-buybox__quantity__trigger-custom-options .ui-pdp-buybox__quantity__chevron {
    justify-content: flex-end;
    display: flex;
    flex: 1;
    padding-left: 0;
  }
  .ui-pdp-buybox__quantity__trigger {
    cursor: pointer;
    padding: 0;
    height: auto;
    line-height: 1;
    border: 0;
  }
  .ui-pdp-buybox__quantity__trigger:hover,
  .ui-pdp-buybox__quantity__trigger :focus,
  .ui-pdp-buybox__quantity__trigger :active {
    background-color: transparent;
  }
  .ui-pdp-buybox__quantity__trigger .andes-button__content {
    display: grid;
    max-width: 275px;
    grid-auto-flow: column;
  }
  .ui-pdp-buybox__quantity__trigger--options .andes-button__content {
    max-width: 320px;
  }
  .ui-pdp-buybox__quantity__trigger--options .andes-button__content .ui-pdp-buybox__quantity__selected__label {
    float: none;
    display: inline;
  }
  .ui-pdp-buybox__quantity__messages {
    line-height: 18px;
  }
  .ui-pdp-buybox__quantity__messages__message {
    display: flex;
    margin: 4px 4px 4px 0;
  }
  .ui-pdp-buybox__quantity__messages__message .ui-pdp-price__part {
    line-height: inherit;
  }
  .ui-pdp-buybox__quantity__messages__message .ui-pdp-price__part .price-tag-cents {
    line-height: inherit;
  }
  .ui-pdp-buybox__quantity__messages__message:empty {
    display: none;
  }
  .ui-pdp-buybox__quantity:has(p) {
    margin-top: 24px;
  }
  .ui-pdp .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected,
  .ui-pdp .ui-pdp-buybox__quantity__custom-options .ui-pdp-buybox__quantity__selected-error {
    max-width: 148px;
  }

  /* Actions spinner */
  .ui-pdp-actions__container .andes-button.andes-spinner__icon-base .andes-spinner__icon {
    position: absolute;
    inset: 0;
    margin: 0 auto;
    animation: rotate-all 1s linear infinite;
    width: 18px;
    height: 18px;
  }
  .ui-pdp-actions__container .andes-button {
    width: 100%;
  }
  .ui-pdp-actions__container .andes-button--loading .andes-button__content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Actions */
  .ui-pdp-actions {
    width: 100%;
    margin-top: 24px;
  }
  .ui-pdp-actions .andes-button {
    width: 100%;
  }
  .ui-pdp-actions .andes-button--loading .andes-button__content {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ui-pdp-actions .andes-button.andes-button--small .andes-spinner.andes-button__spinner,
  .ui-pdp-actions .andes-button.andes-button--medium .andes-spinner.andes-button__spinner {
    top: 5px;
  }
  .ui-pdp-actions .andes-button.andes-button--quiet .andes-spinner .andes-spinner__icon-border {
    border-color: #2968c8;
  }
  .ui-pdp-actions .andes-button.andes-button--quiet .andes-spinner .andes-spinner__icon-border::after {
    background-color: #2968c8;
  }
  .ui-pdp-actions .andes-button .andes-button__content .ui-pdp-icon {
    margin-right: 8px;
  }
  .ui-pdp-actions .andes-button .andes-button__content .ui-pdp-action-icon--BLUE {
    fill: #3483fa;
  }
  .ui-pdp-actions .andes-button .andes-button__content .ui-pdp-action-icon--WHITE {
    fill: #fff;
  }
  .ui-pdp-actions__container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ui-pdp-actions__container .ui-pdp-action__card-tooltip {
    margin-top: 18px;
    padding: 0;
  }
  .ui-pdp-actions__container .ui-pdp-action__card-tooltip .ui-pdp-card-tooltip__card__content {
    align-items: flex-start;
  }
  .ui-pdp-actions__container > div:has(> .andes-tooltip__trigger) {
    width: inherit;
  }
  .ui-pdp-actions .andes-button--medium {
    line-height: 32px;
  }
  .ui-pdp-actions .andes-progress-indicator-circular {
    position: relative;
    width: 15px;
    height: 15px;
    margin: auto;
  }
  .ui-pdp-actions .andes-progress-indicator-circular .andes-progress-indicator-circular__svg {
    position: absolute;
    top: 0;
    bottom: 0;
  }
  .ui-pdp-actions .ui-pdp-action-primary--disabled,
  .ui-pdp-actions .ui-pdp-action-secondary--disabled {
    cursor: not-allowed;
  }
  .ui-pdp-actions .ui-pdp-action-primary--disabled,
  .ui-pdp-actions .ui-pdp-action-primary {
    margin-top: 0;
  }
  .ui-pdp-actions .ui-pdp-action-separator {
    display: block;
    border-bottom: 1px solid #ddd;
    height: 1px;
    width: 100%;
    margin: 16px 0 8px;
  }
  .ui-pdp-actions__container--featured .ui-pdp-action--primary.andes-button {
    margin-top: 0;
  }
  .ui-pdp-actions__container--featured .andes-button {
    width: 100%;
  }

  /* CX Content */
  .cx-content {
    color: rgba(0,0,0,0.8);
    font-size: 14px;
    font-weight: 300;
    line-height: 1.25;
    border-bottom: 1px solid #ddd;
    padding: 20px;
  }
  .cx-content h1, .cx-content h2, .cx-content h3,
  .cx-content h4, .cx-content h5, .cx-content h6 {
    margin-block-start: revert;
    margin-block-end: revert;
  }
  .cx-content ul, .cx-content ol {
    margin-block-start: revert;
    margin-block-end: revert;
    padding-inline-start: revert;
  }
  .cx-content li {
    list-style: revert;
    margin-block-start: revert;
    margin-block-end: revert;
  }
  .cx-content h1 {
    font-size: 20px;
    line-height: 1.2;
    font-weight: 600;
  }
  .cx-content h2 {
    font-size: 18px;
    line-height: 1.22;
    font-weight: 600;
  }
  .cx-content h3 {
    font-size: 16px;
    line-height: 1.25;
    font-weight: 600;
  }
  .cx-content ul {
    list-style-type: disc;
    list-style-position: inside;
  }
  .cx-content li::before {
    font-size: 10px;
  }
  .cx-content a {
    color: #3483fa;
    text-decoration: none;
  }
  .cx-content p {
    margin: 0;
    font-family: 'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
  }
  .cx-content p:not(:first-child) {
    margin: 16px 0;
  }
  .cx-content p span {
    font-size: 14px;
    font-weight: 300;
    line-height: 1.25;
  }
  .cx-content .wrap-content table {
    border: 1px solid #999;
    border-collapse: collapse;
    text-align: left;
    margin-top: 8px;
    width: 100%;
  }
  .cx-content .wrap-content table th,
  .cx-content .wrap-content table td {
    border: 1px solid #999;
    padding: 8px 12px;
  }
}

@media (min-width: 769px) {
  .cx-content {
    padding: 32px;
  }
}

@media screen and (min-width: 768px) {
  img.poly-component__picture {
    max-width: 70% !important;
    height: auto !important;
  }

  a, a:hover, a:link, a:visited {
    text-decoration: none;
  }

  .cl-card-footer__info-row__description {
    display: none !important;
  }

  .cl-card-footer__info-row {
    display: none !important;
  }

  section.cl-card-footer__ticket-row.ticket-row--free {
    padding: 12px 16px 13px !important;
  }
}
`;

// Calculate delivery date based on current day
function getDeliveryDateRange(minDays: number = 2, maxDays: number = 5): { minDate: string; maxDate: string } {
  const now = new Date();
  const min = new Date(now);
  min.setDate(min.getDate() + minDays);
  const max = new Date(now);
  max.setDate(max.getDate() + maxDays);

  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const fmtShort = (d: Date) => `${d.getDate()}/${months[d.getMonth()]}`;

  return { minDate: fmtShort(min), maxDate: fmtShort(max) };
}

// Process the raw HTML: strip <main> wrapper, sanitize external links, and ensure shipping dates are current
function processHtml(raw: string): string {
  // Remove <main ...> and </main> wrapper
  let html = raw.replace(/^[\s\S]*?<main[^>]*>\s*/i, "");
  html = html.replace(/\s*<\/main>\s*$/i, "");
  // Remove all <script> tags and their content
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  // Neutralize all href on <a> tags to prevent external navigation
  html = html.replace(/<a\s([^>]*?)href="[^"]*"([^>]*)>/gi, "<a $1$2>");
  html = html.replace(/<a\s([^>]*?)href='[^']*'([^>]*)>/gi, "<a $1$2>");
  // Remove any remaining href="" on any element (except <use> and <link>)
  html = html.replace(/(<(?!use|link)[^>]*?)\s+href="[^"]*"/gi, "$1");
  // Remove form actions and methods
  html = html.replace(/(<form[^>]*?)\s*action="[^"]*"/gi, "$1");
  html = html.replace(/(<form[^>]*?)\s*method="[^"]*"/gi, "$1");
  // Remove blob: video sources
  html = html.replace(/src="blob:[^"]*"/gi, 'src=""');

  // Dynamically replace hardcoded delivery dates with current real date
  const range = getDeliveryDateRange(2, 5);
  html = html.replace(/entre\s+\d{1,2}\/[a-z]{3}\s+e\s+\d{1,2}\/[a-z]{3}/gi, `entre ${range.minDate} e ${range.maxDate}`);
  html = html.replace(/entre\s*27\/mar\s*e\s*1\/abr/gi, `entre ${range.minDate} e ${range.maxDate}`);
  html = html.replace(/entre\s+terça-feira\s+e\s+quarta-feira/gi, `entre ${range.minDate} e ${range.maxDate}`);

  return html;
}

const MOBILE_CSS_URLS = [
  "https://http2.mlstatic.com/frontend-assets/shorts-nordic-viewer/videojs.4ff5eea5e00eaf6f87b4.css",
  "https://http2.mlstatic.com/frontend-assets/vpp-frontend/vpp-mobile.0db67aa3.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.19.0/mercadolibre/navigation-mobile.css",
  "https://http2.mlstatic.com/frontend-assets/vpp-frontend/vpp-np.mobile.2ac8bcd1.css",
];

const PDP_MOBILE_STYLES = `
@media screen and (max-width: 767px) {
  .andes-form-control--textfield .andes-form-control__bottom {
    margin: 8px 0 0 6px;
  }
  .andes-form-control--textfield .andes-form-control__label {
    margin: 0 0 6px 6px;
  }

  .calculator-block-mobile__bottom-sheet.andes-bottom-sheet {
    padding: 0;
  }

  .ui-pdp {
    background-color: #fff;
  }
  .ui-pdp-container__row {
    flex-grow: 1;
  }
  .ui-pdp-with--separator:not(:empty)::after {
    width: 100%;
  }
  .ui-pdp-with--separator + .ui-pdp-with--separator > .ui-pdp-other-sellers {
    margin-top: 0;
  }
  .ui-pdp-with--separator .ui-recommendations-list__container--double {
    padding: 0 16px;
  }
  .ui-pdp .ui-pdp-benefits {
    margin-bottom: 16px;
  }
  .ui-pdp .ui-vpp-gift-registry__container.ui-vpp-gift-registry--mobile {
    margin-top: 16px;
  }
  .ui-pdp--cbt-summary:not(:empty) {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .ui-pdp--cbt-summary-rebranding:not(:empty) {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .ui-pdp-container--bottom {
    background: #ebebeb;
    padding-top: 16px;
  }
  .ui-pdp-container__row--breadcrumb {
    padding: 32px 16px;
  }
  .ui-pdp-container__row--advertising {
    padding: 32px 16px;
  }
  .ui-pdp-container__row--related-reviews {
    padding: 0 16px 32px;
  }
  .ui-pdp-reviews {
    margin-bottom: 14px;
  }
  .ui-pdp-spot-middle {
    width: 100%;
  }
  .ui-pdp-carousel-cheaper {
    background: #f5f5f5;
    padding: 16px 0 20px;
  }

  .ui-pdp-container__row--cbt-summary {
    margin-top: 20px;
  }
  .ui-pdp-container__row--cbt-summary-rebranding {
    margin-top: 20px;
  }
  .ui-pdp-container__row--cbt-taxes-summary {
    margin-bottom: 20px;
  }
  .ui-pdp-container__row--cbt-taxes-fc-us-summary {
    margin-bottom: 4px;
    display: contents;
  }
  .ui-pdp-container__row--description .ui-pdp-collapsable__action {
    margin-bottom: 32px;
  }
  .ui-pdp-container__row--grouped-share-bookmark {
    margin-left: 16px;
    margin-right: 16px;
  }
  .ui-pdp-bookmark__link-bookmark {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .ui-pdp-bookmark__link-bookmark .ui-pdp-icon-wrapper {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }
  .ui-pdp-bookmark__label {
    white-space: nowrap;
  }
  @keyframes bookmark-pulse {
    0% { transform: scale(1); }
    40% { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
  .ui-pdp-container__row .ui-pdp-special-shipping-summary .ui-pdp-promotions-pill-label {
    padding-inline: 6px;
  }

  .ui-pdp-stock-and-full .ui-pdp-icon--full {
    top: 3px;
    width: 50px;
    height: 15px;
  }
  .ui-pdp-stock-and-full .ui-pdp-icon--full-super {
    width: fit-content;
    height: fit-content;
  }
  .ui-pdp-stock-and-full .ui-pdp-promotions-pill {
    margin-top: 2px;
  }
  .ui-pdp-stock-and-full .ui-pdp-promotions-pill-label--with-icon {
    padding: 0;
  }

  .ui-box-component-pdp__visible--mobile {
    width: 100%;
    padding: 0 16px;
  }
  .ui-box-component-pdp__hidden--mobile {
    display: none;
  }
  .ui-seller-data-status__info-icon {
    display: -webkit-inline-box !important;
  }
  .ui-review-capability-comments__comment__rating {
    display: inherit !important;
  }
  .ui-review-capability__rating__rating {
    display: -webkit-inline-box !important;
  }
  .ui-box-component {
    border-top: 0;
    margin-top: 0;
  }

  .container-advertising.ui-fullscreen-ad-pdp.loaded {
    margin-top: 26px;
    padding: 16px;
  }

  .ui-vpp-highlighted-specs__features {
    width: 100%;
  }

  .ui-review-view__comments__review-comment__likes .andes-button {
    padding: 0;
  }
  .ui-review-view__comments__review-comment__likes .andes-button__content .ui-review-view__comments__review-comment__likes__like .andes-button--transparent path {
    fill: #666;
  }
  .ui-review-view__comments__review-comment__likes .ui-review-view__comments__review-comment__button {
    color: #666;
    padding: 0;
    height: 20px;
    font-weight: 300;
    outline: none;
    box-shadow: none;
    border: 0;
  }
  .ui-review-view__comments__review-comment__likes .andes-button--transparent path {
    stroke: transparent !important;
    fill: #666;
  }

  .ui-pdp-banner + .ui-pdp-container__row.ui-pdp-container__row--returns-summary {
    margin-top: 24px;
  }

  .ui-pdp-reviews-capability__separator {
    margin: 0 0 40px;
  }

  /* VPP styles overrides */
  main[role='main'] .ui-pdp-questions__input {
    margin-top: 16px;
  }
  main[role='main'] .ui-pdp-questions__button {
    margin-top: 24px;
  }
  main[role='main'] .ui-pdp .ui-box-component-carousel-free {
    padding-top: 0;
    padding-bottom: 0;
  }
  main[role='main'] .ui-pdp .ui-pdp-container__row--top-available-quantity-summary {
    margin: 8px 4px;
  }
  main[role='main'] .ui-pdp .ui-pdp-container__row--top-available-quantity-summary svg {
    width: 15px;
    height: 15px;
    top: 1px;
    margin-right: 4px;
  }
  main[role='main'] .ui-pdp .ui-pdp-container__row--top-available-quantity-summary .ui-pdp-action-modal__link {
    font-weight: 600;
  }
  main[role='main'] .ui-pdp .ui-pdp-container__row--bulk-sale-quantity {
    margin-top: 8px;
    display: block;
  }
  main[role='main'] .ui-pdp .ui-pdp-container__row--bulk-sale-quantity + .ui-pdp-actions {
    margin-top: 24px;
  }
  main[role='main'] .ui-pdp .ui-pdp-container__row--bulk-sale-quantity .calculator-block-mobile__trigger__text-container {
    display: grid;
  }
  main[role='main'] .ui-pdp .ui-pdp-container__row--warranty {
    flex-grow: 1;
  }
  main[role='main'] .ui-pdp .ui-vpp-box.warranty > .ui-vpp-box__item {
    margin-bottom: 32px;
  }
  main[role='main'] .ui-pdp .ui-vpp-box.warranty > .ui-vpp-box__item:last-child {
    margin-bottom: 0;
  }
  main[role='main'] .ui-pdp .ui-vpp-box.warranty .ui-vpp-box__item__title {
    margin-bottom: 8px;
  }
  main[role='main'] .ui-pdp .ui-pdp-buybox__quantity.ui-quantity--with-moq {
    margin-bottom: 8px;
  }
  main[role='main'] .ui-pdp .ui-pdp-buybox__quantity.ui-quantity--with-moq-last {
    margin-bottom: 0;
  }
  main[role='main'] .ui-pdp .ui-pdp-stock-and-full-last:has(.ui-pdp-container__row--highlights-scarcity) {
    margin-top: 24px;
  }
  main[role='main'] .ui-pdp .ui-pdp-stock-and-full-last .ui-pdp-container__row--highlights-scarcity {
    margin-bottom: 4px;
  }
  main[role='main'] .ui-pdp .ui-pdp-stock-and-full-last .ui-pdp-promotions-pill-label__icon .ui-pdp-icon--full {
    height: 15px;
    width: 50px;
  }
  main[role='main'] .ui-pdp .ui-pdp-moq-information {
    margin-bottom: 24px;
  }
  main[role='main'] .ui-pdp .ui-pdp-compats__compats {
    padding-top: 0;
  }
  main[role='main'] .ui-pdp .ui-pdp-compats__compats.compats-block-sticky-active {
    padding-top: 32px;
  }
  main[role='main'] .ui-pdp-reviews-capability__separator {
    margin: 0 0 40px;
  }
  main[role='main'] .ui-pdp-collapsable-card__card--skeleton {
    margin: 12px 16px 0;
    width: auto;
  }
  main[role='main'] .ui-pdp__collapsable-card {
    margin: 12px 16px 0;
  }
  main[role='main'] .ui-pdp-questions .ui-pdp-question-warning__action {
    background: none;
    padding: 0;
    margin: 0;
    line-height: 1.4;
    flex-shrink: 0;
  }
  main[role='main'] .ui-vpp-recommendations-top .ui-recommendations-combos-wrapper-ref .ui-recommendations-footer,
  main[role='main'] .ui-vpp-recommendations-top .ui-recommendations-combos-wrapper-ref .ui-recommendations-footer__actions {
    padding-bottom: 0;
  }
}

@media screen and (max-width: 767px) {
  /* Common VPP styles */
  .ui-pdp {
    font-size: 16px;
    margin: 0 auto;
  }
  .ui-pdp-separator {
    width: 1px;
    height: 12px;
    background-color: #999;
    display: inline-block;
    vertical-align: 2px;
    margin: 0 10px;
  }
  .ui-pdp a {
    -webkit-tap-highlight-color: rgba(0,0,0,0.1);
  }
  .ui-pdp sup {
    vertical-align: top;
    font-size: 10px;
    position: relative;
    top: 2px;
  }
  .ui-pdp .container-returns-notification {
    margin-top: 16px;
  }
  .ui-pdp .container-returns-notification .ui-pdp-action-modal {
    margin: 0;
  }
  .ui-pdp .container-returns-notification .returns-notification__actions {
    display: flex;
    flex-flow: wrap;
    gap: 8px;
    padding: 8px 0 0;
  }
  .ui-pdp .container-returns-notification .returns-notification__actions .andes-button.link {
    background-color: transparent;
    line-height: 16px;
    padding: 0;
    height: 16px;
  }

  .andes-tabs__wrapper {
    box-shadow: unset;
  }
  .andes-tabs__slider {
    border-radius: 3px 3px 0 0;
  }

  .ui-recommendations-comparator .andes-tabs-content {
    position: relative;
  }
  .ui-recommendations-comparator .andes-tabs-content::before {
    content: '';
    position: absolute;
    height: 1px;
    width: 100%;
    top: 0;
    box-shadow: inset 0 -1px 0 0 rgba(0,0,0,0.1);
    pointer-events: none;
    z-index: 3;
  }
  .ui-recommendations-comparator .andes-tabs__slider {
    height: 2px !important;
  }

  .ui-review-capability-vpp {
    width: 100%;
    margin-bottom: 80px;
  }
  .ui-review-capability-vpp .andes-button[type='submit'] {
    width: 100%;
    margin-top: 20px;
  }
}

@media screen and (max-width: 767px) {
  .ui-review-capability-categories {
    margin-top: 8px;
  }
  .ui-review-capability-categories__title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
  }
  .ui-review-capability-categories__attributes {
    width: 100%;
    border-collapse: separate;
    font-size: 14px;
    font-weight: 400;
  }
  .ui-review-capability-categories__desktop--row {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }
  .ui-review-capability-categories__desktop--row td:first-child {
    margin-bottom: 2px;
  }
  .ui-review-capability-categories__desktop--row svg {
    margin-right: 5px;
  }
  .ui-review-capability-categories__rating__star {
    stroke: #3483fa;
    fill: #3483fa;
  }
  .ui-review-capability-categories__rating__star-empty {
    stroke: #ddd;
    fill: transparent;
  }
  .ui-review-capability-categories__mobile--row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-auto-flow: column;
    grid-template-rows: 1fr;
    gap: 0px 0px;
    grid-template-areas: 'label stars';
    margin-bottom: 13px;
    color: rgba(0,0,0,0.9);
  }
  .ui-review-capability-categories__mobile--row > td:first-child {
    grid-area: label;
  }
  .ui-review-capability-categories__mobile--row > td:last-child {
    grid-area: stars;
    text-align: end;
  }
  .ui-review-capability-categories__mobile--row .ui-review-capability-categories__rating {
    display: flex;
    justify-content: space-evenly;
  }
  .ui-review-capability-categories__mobile--row:last-child,
  .ui-review-capability-categories__desktop--row:last-child {
    margin-bottom: 0;
  }
  .ui-review-capability-categories__max-row-w {
    width: 73%;
  }
  .ui-review-capability-categories__show-more,
  .ui-review-capability-categories__show-more.andes-button {
    display: inline-block;
    height: auto;
    padding: 0;
    border: 0;
    border-radius: 0;
    color: #3483fa;
    margin-left: 2px;
    font-size: 13.33px;
    font-weight: 400;
    line-height: normal;
  }
  .ui-review-capability-categories__show-more:hover,
  .ui-review-capability-categories__show-more.andes-button:hover {
    background: none;
  }
  .ui-review-capability-categories__show-more .andes-button__content::after {
    display: none;
  }
  .ui-review-capability-categories__chevron {
    display: inline-block;
    margin-left: 8px;
    width: 12px;
    height: 10px;
    stroke: #3483fa;
    transform: rotate(270deg);
  }
  .ui-review-capability-categories__chevron path {
    stroke-width: 4px;
  }
  .ui-review-capability-categories__chevron--active {
    transform: rotate(90deg);
  }
}

@media screen and (max-width: 767px) {
  * {
    font-family: 'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif !important;
  }

  .cx-content {
    color: rgba(0,0,0,0.8);
    font-size: 14px;
    font-weight: 300;
    line-height: 1.25;
    border-bottom: 1px solid #eee;
    padding: 20px;
  }
  .cx-content h1, .cx-content h2, .cx-content h3,
  .cx-content h4, .cx-content h5, .cx-content h6 {
    margin-block-start: revert;
    margin-block-end: revert;
  }
  .cx-content ul, .cx-content ol {
    margin-block-start: revert;
    margin-block-end: revert;
    padding-inline-start: revert;
  }
  .cx-content li {
    list-style: revert;
    margin-block-start: revert;
    margin-block-end: revert;
  }
  .cx-content h1 {
    font-size: 20px;
    line-height: 1.2;
    font-weight: 600;
  }
  .cx-content h2 {
    font-size: 18px;
    line-height: 1.22;
    font-weight: 600;
  }
  .cx-content h3 {
    font-size: 16px;
    line-height: 1.25;
    font-weight: 600;
  }
  .cx-content ul {
    list-style-type: disc;
    list-style-position: inside;
  }
  .cx-content li::before {
    font-size: 10px;
  }
  .cx-content a {
    color: #3483fa;
    text-decoration: none;
  }
  .cx-content p {
    margin: 0;
    font-family: 'Proxima Nova', -apple-system, 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
  }
  .cx-content p:not(:first-child) {
    margin: 16px 0;
  }
  .cx-content p span {
    font-size: 14px;
    font-weight: 300;
    line-height: 1.25;
  }
  .cx-content .wrap-content table {
    border: 1px solid #ddd;
    border-collapse: collapse;
    text-align: left;
    margin-top: 8px;
    width: 100%;
  }
  .cx-content .wrap-content table th,
  .cx-content .wrap-content table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
  }
}

@media screen and (max-width: 767px) {
  /* Andes button fix */
  .andes-button__content {
    position: relative;
    top: -1px;
  }

  /* Snackbar fixes */
  .ui-snackbar {
    z-index: 100000;
  }
  .andes-snackbar {
    left: 0;
    right: 0;
    z-index: 100000;
    bottom: 2em;
  }
  .andes-snackbar--animate-show {
    animation-name: snackbar-show-fix;
  }
  .andes-snackbar--animate-hide {
    animation-name: snackbar-hide-fix;
    animation-fill-mode: forwards;
  }
  .andes-snackbar.andes-snackbar--red {
    background-color: #f23d4f;
  }
  .andes-snackbar.andes-snackbar--green {
    background-color: #00a650;
  }
  .andes-snackbar__message {
    font-weight: 400;
  }
  .andes-snackbar__action {
    padding-right: 1.5em;
  }

  /* Dropdown */
  .andes-dropdown__arrow::after {
    border-color: #3483fa;
  }
  .andes-dropdown__trigger:hover .andes-dropdown__arrow::after {
    border-color: #3483fa;
  }

  /* Modal */
  .andes-modal--full .andes-modal__header.andes-modal__header--sticky .andes-modal-title {
    text-align: left;
    padding-left: 45px;
  }
  .andes-modal__close-button path {
    stroke: #3483fa;
  }
  .andes-modal__overlay--card .andes-modal__close-button path {
    stroke: none;
  }
  .andes-modal__overlay {
    z-index: 99999;
  }

  /* Table fixes */
  .andes-table {
    border-collapse: collapse;
    border: 1px solid #ededed;
  }
  .andes-table__header {
    box-shadow: none;
    background-color: #ededed;
  }
  .andes-table__column,
  .andes-table__header {
    display: table-cell;
    box-shadow: none;
    padding: 15px 16px;
    text-align: left;
    vertical-align: middle;
    white-space: normal;
  }
  .andes-table__column:last-of-type,
  .andes-table__header:last-of-type {
    padding: 15px 24px 15px 16px;
  }
  .andes-table__row {
    box-shadow: none;
  }
  .andes-table__column--value {
    margin: 0;
  }
  .andes-table__header__container {
    background-color: transparent;
    border: none;
    display: block;
    font: inherit;
    padding: 0;
  }

  /* Transparent button */
  .andes-button--transparent path[fill]:not([fill='none']) {
    fill: #999 !important;
  }
  .andes-button--transparent :hover path[fill],
  .andes-button--transparent :active path[fill],
  .andes-button--transparent :focus path[fill],
  .andes-button--transparent path[fill] {
    fill: none !important;
  }
  .andes-button--transparent.active path[fill]:not([fill='none']) {
    fill: #fff !important;
  }
  .andes-button--transparent:not(.active):hover path[fill]:not([fill='none']) {
    fill: #3483fa !important;
  }
  .andes-button--loud path[fill],
  .andes-button--loud:hover path[fill],
  .andes-button--loud:focus path[fill],
  .andes-button--loud:active path[fill] {
    fill: none !important;
  }

  /* Tooltip z-index */
  .andes-tooltip {
    z-index: 10000;
  }

  /* Colors */
  .ui-pdp-color--GREEN { color: #00a650; }
  .ui-pdp-color--GREEN_60 { color: #00a650; }
  .ui-pdp-color--GRAY { color: #999; }
  .ui-pdp-color--GRAY_40 { color: #bfbfbf; }
  .ui-pdp-color--LIGHT_GRAY { color: #ccc; }
  .ui-pdp-color--BLACK { color: #333; }
  .ui-pdp-color--BLACK_100 { color: #000; }
  .ui-pdp-color--RED { color: #f23d4f; }
  .ui-pdp-color--RED_600 { color: #f23d4f; }
  .ui-pdp-color--ORANGE { color: #f73; }
  .ui-pdp-color--ORANGE_200 { color: #f73; }
  .ui-pdp-color--ORANGE_600 { color: #f73; }
  .ui-pdp-color--ORANGE_MEDIUM { color: #f73; }
  .ui-pdp-color--BLUE { color: #3483fa; }
  .ui-pdp-color--BLUE_600 { color: #3483fa; }
  .ui-pdp-color--BLUE_700 { color: #2968c8; }
  .ui-pdp-color--WHITE { color: #fff; }
  .ui-pdp-color--LIGHT_BROWN { color: #a18850; }

  /* Background Colors */
  .ui-pdp-background-color--GREEN { background-color: #00a650; }
  .ui-pdp-background-color--GREEN_60 { background-color: #00a650; }
  .ui-pdp-background-color--GRAY { background-color: #999; }
  
  .ui-pdp-background-color--GRAY_4 { background-color: #bfbfbf; }
  .ui-pdp-background-color--LIGHT_GRAY { background-color: rgba(0,0,0,0.1); }
  .ui-pdp-background-color--MEDIUM_GRAY { background-color: #666; }
  .ui-pdp-background-color--BLACK { background-color: #333; }
  .ui-pdp-background-color--BLACK_10 { background-color: rgba(0,0,0,0.1); }
  .ui-pdp-background-color--RED { background-color: #f23d4f; }
  .ui-pdp-background-color--RED_600 { background-color: #f23d4f; }
  .ui-pdp-background-color--ORANGE { background-color: #f73; }
  .ui-pdp-background-color--ORANGE_200 { background-color: #f73; }
  .ui-pdp-background-color--ORANGE_600 { background-color: #f73; }
  .ui-pdp-background-color--BLUE { background-color: #3483fa; }
  .ui-pdp-background-color--BLUE_700 { background-color: #2968c8; }
  .ui-pdp-background-color--LIGHT_BLUE { background-color: #e6f0ff; }
  .ui-pdp-background-color--BLUE_10 { background-color: rgba(52,131,250,0.1); }
  .ui-pdp-background-color--LIGHT_YELLOW { background-color: #fff8e6; }
  .ui-pdp-background-color--VIOLET_600 { background-color: #7b61ff; }
  .ui-pdp-background-color--LIGHT_GREEN { background-color: #e6f7ed; }
  .ui-pdp-background-color--LIGHT_ORANGE { background-color: rgba(255,119,51,0.1); }
  .ui-pdp-background-color--WHITE { background-color: #fff; }

  /* Font sizes */
  .ui-pdp-size--XXXSMALL { font-size: 10px; }
  .ui-pdp-size--XXSMALL { font-size: 12px; }
  .ui-pdp-size--XSMALL { font-size: 13px; }
  .ui-pdp-size--SMALL { font-size: 14px; }
  .ui-pdp-size--MEDIUM { font-size: 16px; }
  .ui-pdp-size--LARGE { font-size: 20px; }
  .ui-pdp-size--XLARGE { font-size: 24px; }
  .ui-pdp-size--XXLARGE { font-size: 32px; }

  /* Font weights */
  .ui-pdp-family--LIGHT { font-weight: 300; }
  .ui-pdp-family--REGULAR { font-weight: 400; }
  .ui-pdp-family--SEMIBOLD { font-weight: 600; }
  .ui-pdp-family--BOLD { font-weight: 700; }

  /* Text alignment */
  .ui-vpp-text-alignment--center {
    text-align: center;
    width: 100%;
    margin: 0 auto;
  }

  /* Spacing utilities */
  .m-0 { margin: 0; } .p-0 { padding: 0; }
  .mt-0 { margin-top: 0; } .pt-0 { padding-top: 0; }
  .mb-0 { margin-bottom: 0; } .pb-0 { padding-bottom: 0; }
  .ml-0 { margin-left: 0; } .pl-0 { padding-left: 0; }
  .mr-0 { margin-right: 0; } .pr-0 { padding-right: 0; }
  .mt-2 { margin-top: 2px; } .mb-2 { margin-bottom: 2px; }
  .mt-4 { margin-top: 4px; } .mb-4 { margin-bottom: 4px; }
  .ml-4 { margin-left: 4px; } .mr-4 { margin-right: 4px; }
  .mt-8 { margin-top: 8px; } .mb-8 { margin-bottom: 8px; }
  .ml-8 { margin-left: 8px; } .mr-8 { margin-right: 8px; }
  .pt-8 { padding-top: 8px; } .pb-8 { padding-bottom: 8px; }
  .pl-8 { padding-left: 8px; } .pr-8 { padding-right: 8px; }
  .mt-12 { margin-top: 12px; } .mb-12 { margin-bottom: 12px; }
  .mt-16 { margin-top: 16px; } .mb-16 { margin-bottom: 16px; }
  .ml-16 { margin-left: 16px; } .mr-16 { margin-right: 16px; }
  .pl-16 { padding-left: 16px; } .pr-16 { padding-right: 16px; }
  .pt-16 { padding-top: 16px; } .pb-16 { padding-bottom: 16px; }
  .mt-20 { margin-top: 20px; } .mb-20 { margin-bottom: 20px; }
  .mt-24 { margin-top: 24px; } .mb-24 { margin-bottom: 24px; }
  .ml-24 { margin-left: 24px; } .mr-24 { margin-right: 24px; }
  .pl-24 { padding-left: 24px; } .pr-24 { padding-right: 24px; }
  .mt-32 { margin-top: 32px; } .mb-32 { margin-bottom: 32px; }
  .pt-32 { padding-top: 32px; } .pb-32 { padding-bottom: 32px; }
  .mt-40 { margin-top: 40px; } .mb-40 { margin-bottom: 40px; }
  .mt-48 { margin-top: 48px; } .mb-48 { margin-bottom: 48px; }
  .mt-64 { margin-top: 64px; } .mb-64 { margin-bottom: 64px; }

  /* Icon styles */
  .ui-pdp-icon--pin { fill: #3483fa; }
  .ui-pdp-icon--pin { fill: #3483fa; }
  .ui-pdp-icon--chevron {
    height: 14px;
    stroke: #3483fa;
    width: 9px;
    vertical-align: middle;
  }
  .ui-pdp-icon--whatsapp path,
  .ui-pdp-icon.ui-pdp-icon--whatsapp path {
    stroke: none !important;
  }
  .ui-pdp-icon--external-credits {
    height: 20px;
    width: 20px;
    margin-right: 16px;
  }
  .ui-pdp-icon--chevron-down {
    transform: rotate(-270deg);
    transition: 0.3s transform ease-in-out;
  }
  .ui-pdp-icon--chevron-down--error {
    stroke: #f23d4f !important;
  }
  .ui-pdp-icon--chevron-down--active {
    transform: rotate(-90deg);
    transition: 0.3s transform ease-in-out;
  }
  .ui-pdp-icon--return {
    height: 18px;
    width: 15px;
  }
  .ui-pdp-icon--full {
    fill: #00a650;
    position: relative;
    top: 4px;
    height: 16px;
    width: 56px;
    margin-top: -1px;
  }
  .ui-pdp-icon--full-super { margin-top: -4px; }
  .ui-pdp-icon--plus { position: relative; top: 1px; }
  .ui-pdp-icon--express,
  .ui-pdp-icon--icon-package {
    fill: #eee;
    width: 48px;
    height: 48px;
  }
  .ui-pdp-icon--seller-agreement { margin-top: 1px; }
  .ui-pdp-icon--thumb_up { margin-left: 4px; }
  .ui-pdp-icon--loyalty { fill: #919191; }
  .ui-pdp-icon--medal { width: 20px; height: 20px; }
  .ui-pdp-icon--help { fill: #3483fa; stroke: #3483fa; }
  .ui-pdp-icon--cbt-summary { margin-right: 8px; }
  .ui-pdp-icon--MELI_USD { fill: rgba(0,0,0,0); margin-right: 4px; }

  .ui-pdp-color--GREEN .ui-pdp-icon { fill: #00a650; }
  .ui-pdp-color--BLACK .ui-pdp-icon { fill: #333; }
  .ui-pdp-color--BLACK_100 .ui-pdp-icon { fill: #000; }
  .ui-pdp-color--WHITE .ui-pdp-icon { fill: #fff; }
  .ui-pdp-color--BLUE .ui-pdp-icon { fill: #3483fa; }
  .ui-pdp-color--BLUE_700 .ui-pdp-icon { fill: #2968c8; }
  
  .ui-pdp-color--ORANGE .ui-pdp-icon { fill: #f73; }
  .ui-pdp-color--ORANGE_MEDIUM .ui-pdp-icon { color: #f73; }
  .ui-pdp-icon--coupon.ui-pdp-color--BLUE .ui-pdp-icon { fill: none; }

  /* Misc */
  .ui-pdp-gallery__column { z-index: 0; }
  .line-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .non-selectable { user-select: none; }
  #comparator { display: none !important; }
  .ui-pdp--hide {
    position: absolute;
    border: 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    margin: 0 -1px -1px 0;
    overflow: hidden;
    padding: 0;
  }
  .images__img { width: 100%; }

  /* Nav search */
  .nav-search .nav-category { right: 46px; padding: 2px 14px; }
  .nav-search .nav-category input[type='checkbox'] { margin: 3px 9px 0 0; }

  /* Font smoothing */
  main { -webkit-font-smoothing: antialiased; }
}

@keyframes snackbar-show-fix {
  from { opacity: 0; transform: translate3d(0, 100%, 0); }
  to { opacity: 1; }
}
@keyframes snackbar-hide-fix {
  50% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(0, 100%, 0); }
}

.poly-fw-light{font-weight:300 !important}.poly-fw-regular{font-weight:400 !important}.poly-fw-semibold{font-weight:600 !important}.poly-fw-bold{font-weight:700 !important}.poly-fst-normal{font-style:normal !important}.poly-fst-italic{font-style:italic !important}.poly-fs-xxs{font-size:10px !important}.poly-fs-xs{font-size:12px !important}.poly-fs-s{font-size:14px !important}.poly-fs-xm{font-size:16px !important}.poly-fs-m{font-size:18px !important}.poly-fs-l{font-size:20px !important}.poly-fs-xl{font-size:24px !important}.poly-fs-xxl{font-size:28px !important}.poly-fs-xxxl{font-size:32px !important}.poly-fs-huge{font-size:44px !important}.poly-lh-xxs{line-height:1 !important}.poly-lh-xs{line-height:1.15 !important}.poly-lh-s{line-height:1.25 !important}.poly-lh-xm{line-height:1.35 !important}.poly-lh-m{line-height:1.45 !important}.poly-lh-l{line-height:1.56 !important}.poly-lh-xl{line-height:1.79 !important}.poly-lh-xxl{line-height:2.03 !important}.poly-lh-xxxl{line-height:2.26 !important}.poly-lh-huge{line-height:2.5 !important}.poly-tt-capitalize{text-transform:capitalize !important}.poly-tt-uppercase{text-transform:uppercase !important}.poly-tt-lowercase{text-transform:lowercase !important}.poly-tt-none{text-transform:none !important}.poly-jc-start{justify-content:flex-start !important}.poly-jc-end{justify-content:flex-end !important}.poly-jc-center{justify-content:center !important}.poly-jc-between{justify-content:space-between !important}.poly-jc-around{justify-content:space-around !important}.poly-jc-evenly{justify-content:space-evenly !important}.poly-jc-stretch{justify-content:stretch !important}.poly-jc-baseline{justify-content:baseline !important}.poly_empty_star{stroke:var(--andes-color-blue-500, #3483fa);fill:rgba(0,0,0,0)}s.poly-phrase-price{display:inline-flex}.poly-phrase-price.andes-money-amount:not(.andes-money-amount--previous),.poly-phrase-price.andes-money-amount:not(.andes-money-amount--previous) *{display:inline-flex;color:inherit}.poly-phrase-price.andes-money-amount:not(.andes-money-amount--weight-regular):not(.andes-money-amount--weight-semibold),.poly-phrase-price.andes-money-amount:not(.andes-money-amount--weight-regular):not(.andes-money-amount--weight-semibold) *{font-weight:inherit}.poly-phrase-pill{-webkit-box-decoration-break:clone;align-items:center;background-color:var(--poly-phrase-pill-background-color, var(--andes-color-blue-200, rgba(65, 137, 230, 0.2)));border-radius:2px;box-decoration-break:clone;color:var(--poly-phrase-pill-color, var(--andes-color-blue-500, #3483fa));cursor:pointer;display:inline;font-size:var(--poly-phrase-pill-font-size, 14px);font-weight:var(--poly-phrase-pill-font-weight, 600);line-height:var(--poly-phrase-pill-line-height, 18px);padding:var(--poly-phrase-pill-padding, 0 4px);text-decoration:none}.poly-phrase-pill svg{transform:translateY(2px);vertical-align:text-top}
`;


interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number;
  image: string | null;
  images: any;
  description: string | null;
  stock: number;
  sales: number;
  fake_orders: number;
  condition: string;
  checkout_type: string;
  payment_link: string | null;
  enable_pix: boolean;
  enable_boleto: boolean;
  variants?: Array<{
    id: string;
    group_name: string;
    option_name: string;
    image: string | null;
    price: number;
    stock: number;
    payment_link?: string;
  }>;
}

interface CardSettings {
  enabled: boolean;
  max_installments: number;
  monthly_rate: number;
  free_installments: number;
}

function formatPrice(value: number, currencySymbol: string): { integer: string; cents: string } {
  const abs = Math.abs(value);
  const integer = Math.floor(abs).toLocaleString('pt-BR');
  const cents = (abs % 1).toFixed(2).slice(2);
  return { integer, cents };
}

// Emits the cents superscript block to append after a __fraction span. Empty string if cents are "00".
// Mirrors the Andes markup: invisible comma + superscript cents span.
function centsSuffixHtml(cents: string, amountSize: number): string {
  if (cents === '00') return '';
  const centsFontSize = Math.max(8, Math.round(amountSize / 2));
  return `<span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-${amountSize}" style="font-size:${centsFontSize}px;margin-top:4px" aria-hidden="true" data-andes-money-amount-cents="true">${cents}</span>`;
}

// Syncs the cents block next to a __fraction element, creating it on the fly if the
// template didn't include one. When cents are "00" the existing block (if any) is hidden.
function syncCentsBlock(fractionEl: Element, cents: string): void {
  const amountEl = (fractionEl.closest('[data-andes-money-amount="true"]') || fractionEl.parentElement) as HTMLElement | null;
  const parent = fractionEl.parentElement;
  if (!parent) return;
  let sep: HTMLElement | null = null;
  let centsEl: HTMLElement | null = null;
  let n: Element | null = fractionEl.nextElementSibling;
  while (n) {
    if (!sep && n.classList?.contains('andes-visually-hidden') && n.textContent === ',') sep = n as HTMLElement;
    else if (n.classList?.contains('andes-money-amount__cents')) { centsEl = n as HTMLElement; break; }
    n = n.nextElementSibling;
  }
  if (cents === '00') {
    if (centsEl) centsEl.style.display = 'none';
    if (sep) sep.style.display = 'none';
    return;
  }
  if (!centsEl) {
    const sizeAttr = amountEl?.getAttribute('data-andes-money-amount-size');
    const size = sizeAttr ? parseInt(sizeAttr, 10) || 36 : 36;
    const centsFontSize = Math.max(8, Math.round(size / 2));
    if (!sep) {
      sep = document.createElement('span');
      sep.className = 'andes-visually-hidden';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = ',';
      fractionEl.insertAdjacentElement('afterend', sep);
    }
    centsEl = document.createElement('span');
    centsEl.className = `andes-money-amount__cents andes-money-amount__cents--superscript-${size}`;
    centsEl.setAttribute('aria-hidden', 'true');
    centsEl.setAttribute('data-andes-money-amount-cents', 'true');
    centsEl.style.fontSize = `${centsFontSize}px`;
    centsEl.style.marginTop = '4px';
    sep.insertAdjacentElement('afterend', centsEl);
  } else if (sep) {
    sep.style.display = '';
  }
  centsEl.textContent = cents;
  centsEl.style.display = '';
}

function calcDiscount(comparePrice: number, price: number): number {
  if (comparePrice <= 0 || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function calcInstallment(price: number, installments: number, monthlyRate: number, freeInstallments: number): { value: number; hasInterest: boolean } {
  if (installments <= freeInstallments) {
    return { value: price / installments, hasInterest: false };
  }
  const r = monthlyRate / 100;
  const total = price * (r * Math.pow(1 + r, installments)) / (Math.pow(1 + r, installments) - 1);
  return { value: total, hasInterest: true };
}

interface DeliverySettings {
  delivery_days_min: number;
  delivery_days_max: number;
  is_free_shipping?: boolean;
}

function getDeliveryDateRangeLong(minDays: number = 2, maxDays: number = 5): { minDate: string; maxDate: string } {
  const now = new Date();
  const min = new Date(now);
  min.setDate(min.getDate() + minDays);
  const max = new Date(now);
  max.setDate(max.getDate() + maxDays);

  const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  return { minDate: weekdays[min.getDay()], maxDate: weekdays[max.getDay()] };
}

function injectShippingData(container: HTMLElement, delivery?: DeliverySettings | null) {
  const shippingBlocks = container.querySelectorAll('.ui-pdp-shipping');
  if (shippingBlocks.length === 0) return;

  const minDays = delivery?.delivery_days_min ?? 2;
  const maxDays = delivery?.delivery_days_max ?? 5;
  const isFree = delivery?.is_free_shipping ?? true;

  const shortRange = getDeliveryDateRange(minDays, maxDays);

  shippingBlocks.forEach(block => {
    const titleEl = block.querySelector('.ui-pdp-media__title');
    if (!titleEl) return;

    const shippingLabel = isFree
      ? `<span class="ui-pdp-color--GREEN ui-pdp-family--SEMIBOLD"><span>Chegará grátis</span></span>`
      : `<span class="ui-pdp-color--GREEN ui-pdp-family--SEMIBOLD"><span>Chegará</span></span>`;
    titleEl.innerHTML = `${shippingLabel}<span> entre ${shortRange.minDate} e ${shortRange.maxDate}</span>`;
  });
}

function injectProductData(container: HTMLElement, product: ProductData, cardSettings: CardSettings, currencySymbol: string, deliverySettings?: DeliverySettings | null) {
  // Title
  const titleEl = container.querySelector('.ui-pdp-title');
  if (titleEl) titleEl.textContent = product.name;

  // Images - get all product images
  const allImages: string[] = [];
  if (product.image) allImages.push(product.image);
  const parsedImages = Array.isArray(product.images) ? product.images : [];
  for (const img of parsedImages) {
    if (typeof img === 'string' && img && !allImages.includes(img)) allImages.push(img);
  }
  if (allImages.length === 0) allImages.push('/placeholder.svg');

  // ── DESKTOP GALLERY: clean default images in .ui-pdp-gallery ──
  const desktopGallery = container.querySelector('.ui-pdp-gallery');
  if (desktopGallery) {
    // Remove ALL existing thumbnail labels beyond real image count
    const allThumbnailLabels = desktopGallery.querySelectorAll('.ui-pdp-gallery__column label');
    allThumbnailLabels.forEach((label, idx) => {
      if (idx < allImages.length) {
        const img = label.querySelector('img');
        if (img) {
          img.setAttribute('src', allImages[idx]);
          img.removeAttribute('srcset');
          img.setAttribute('alt', product.name);
        }
      } else {
        (label as HTMLElement).style.display = 'none';
      }
    });

    // Update main figure images
    const figures = desktopGallery.querySelectorAll('.ui-pdp-gallery__figure__image');
    figures.forEach((img, idx) => {
      if (idx < allImages.length) {
        img.setAttribute('src', allImages[idx]);
        img.removeAttribute('srcset');
        img.setAttribute('data-zoom', allImages[idx]);
        img.setAttribute('alt', product.name);
      } else {
        // Hide parent figure
        const fig = img.closest('figure');
        if (fig) (fig as HTMLElement).style.display = 'none';
      }
    });

    // Add click handlers on thumbnails to switch active blue border and show correct figure
    const allRadios = desktopGallery.querySelectorAll<HTMLInputElement>('input.ui-pdp-gallery__input[name="gallery-radio"]');
    const allWrappers = desktopGallery.querySelectorAll('.ui-pdp-gallery__wrapper');
    allWrappers.forEach((wrapper, idx) => {
      const label = wrapper.querySelector('.ui-pdp-gallery__label');
      if (!label) return;
      label.addEventListener('click', (e) => {
        e.preventDefault();
        // Check the corresponding radio
        allRadios.forEach((radio, rIdx) => {
          radio.checked = rIdx === idx;
        });
        // Show the correct figure, hide others
        allWrappers.forEach((w, wIdx) => {
          const fig = w.querySelector('figure');
          if (fig) (fig as HTMLElement).style.display = wIdx === idx ? '' : 'none';
        });
      });
    });
  }

  // ── MOBILE GALLERY: clean default images in .ui-pdp-container__row--gallery ──
  const mobileGallery = container.querySelector('.ui-pdp-container__row.ui-pdp-container__row--gallery');
  if (mobileGallery) {
    const mobileSlides = mobileGallery.querySelectorAll('.andes-carousel-snapped__slide');
    mobileSlides.forEach((slide, idx) => {
      if (idx < allImages.length) {
        const imgs = slide.querySelectorAll('img');
        imgs.forEach(img => {
          img.setAttribute('src', allImages[idx]);
          img.removeAttribute('srcset');
          img.setAttribute('alt', product.name);
        });
        slide.classList.remove('andes-carousel-snapped__slide--next');
        if (idx === 0) slide.classList.add('andes-carousel-snapped__slide--active');
      } else {
        (slide as HTMLElement).style.display = 'none';
      }
    });

    // Rebuild dots navigation to match actual image count (1 dot per image)
    const dotsContainer = mobileGallery.querySelector('.dots-navigation, .andes-carousel-snapped__pagination');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      allImages.forEach((_, idx) => {
        const li = document.createElement('li');
        li.className = idx === 0
          ? 'dots-navigation__circle active andes-carousel-snapped__dot--active'
          : 'dots-navigation__circle';
        li.dataset.index = String(idx);
        const span = document.createElement('span');
        span.className = idx === 0 ? 'dots-navigation--active' : '';
        li.appendChild(span);
        dotsContainer.appendChild(li);
      });
    }
  }

  // Legacy fallback for thumbnails/figures outside gallery wrapper
  const thumbnailBtns = container.querySelectorAll('.ui-pdp-thumbnail__picture');
  if (thumbnailBtns.length > 0 && !desktopGallery) {
    thumbnailBtns.forEach((btn, idx) => {
      if (idx < allImages.length) {
        const img = btn.querySelector('img');
        if (img) {
          img.setAttribute('src', allImages[idx]);
          img.removeAttribute('srcset');
          img.setAttribute('alt', product.name);
        }
      } else {
        const parent = btn.closest('label');
        if (parent) (parent as HTMLElement).style.display = 'none';
      }
    });
  }

  const figureImages = container.querySelectorAll('.ui-pdp-gallery__figure__image');
  if (figureImages.length > 0 && !desktopGallery) {
    figureImages.forEach((img, idx) => {
      if (idx < allImages.length) {
        img.setAttribute('src', allImages[idx]);
        img.removeAttribute('srcset');
        img.setAttribute('data-zoom', allImages[idx]);
        img.setAttribute('alt', product.name);
      }
    });
  }

  // Prices
  const price = product.price;
  const comparePrice = product.compare_price;
  const discount = calcDiscount(comparePrice, price);
  const pFmt = formatPrice(price, currencySymbol);
  const cFmt = formatPrice(comparePrice, currencySymbol);

  // Original (compare) price
  const originalPriceEl = container.querySelector('.ui-pdp-price__original-value');
  if (originalPriceEl) {
    if (comparePrice > 0 && comparePrice > price) {
      const fracEl = originalPriceEl.querySelector('.andes-money-amount__fraction');
      if (fracEl) {
        fracEl.textContent = cFmt.integer;
        syncCentsBlock(fracEl, cFmt.cents);
      }
      const symbolEls = originalPriceEl.querySelectorAll('.andes-money-amount__currency-symbol');
      symbolEls.forEach(s => s.textContent = currencySymbol);
      originalPriceEl.setAttribute('aria-label', `Antes: ${cFmt.integer} ${currencySymbol}`);
    } else {
      (originalPriceEl.closest('.ui-pdp-price__part__container') as HTMLElement)?.style.setProperty('display', 'none');
    }
  }

  // Main price
  const secondLine = container.querySelector('.ui-pdp-price__second-line');
  if (secondLine) {
    const mainAmount = secondLine.querySelector('.ui-pdp-price__part .andes-money-amount__fraction');
    if (mainAmount) {
      mainAmount.textContent = pFmt.integer;
      syncCentsBlock(mainAmount, pFmt.cents);
    }
    const symbolEls = secondLine.querySelectorAll('.andes-money-amount__currency-symbol');
    symbolEls.forEach(s => s.textContent = currencySymbol);
    const metaPrice = secondLine.querySelector('meta[itemprop="price"]');
    if (metaPrice) metaPrice.setAttribute('content', String(price));

    // Discount badge
    const discountEl = secondLine.querySelector('.andes-money-amount__discount');
    if (discountEl) {
      if (discount > 0) {
        discountEl.textContent = `${discount}% OFF`;
        (discountEl as HTMLElement).style.display = '';
      } else {
        (discountEl as HTMLElement).style.display = 'none';
      }
    }
  }

  // Installments or "À vista" text
  const subtitlesEl = container.querySelector('.ui-pdp-price__subtitles') || container.querySelector('#pricing_price_subtitle');
  if (subtitlesEl) {
    if (!cardSettings.enabled) {
      // Card payment disabled - show "À vista no Pix/Boleto"
      const p = product as any;
      const hasPix = p.enable_pix === true;
      const hasBoleto = p.enable_boleto === true;
      let avistaText = '';
      if (hasPix && hasBoleto) avistaText = 'À vista no Pix e Boleto';
      else if (hasPix) avistaText = 'À vista no Pix';
      else if (hasBoleto) avistaText = 'À vista no Boleto';
      else avistaText = 'À vista';

      (subtitlesEl as HTMLElement).innerHTML = `<span style="font-size: 14px; color: rgb(0, 166, 80); font-weight: 600;">${avistaText}</span>`;
    } else {
      const maxInst = cardSettings.max_installments;
      const { value: instValue, hasInterest } = calcInstallment(price, maxInst, cardSettings.monthly_rate, cardSettings.free_installments);
      const instFmt = formatPrice(instValue, currencySymbol);

      // Mobile template ships two price-parts in the subtitle: first "ou R$ X" (one-time equivalent),
      // then "em Nx R$ Y,YY" (installment). Strip the "ou" label + its price-part so only the
      // installment line remains — and so the querySelectors below hit the correct fraction.
      const partContainers = subtitlesEl.querySelectorAll('.ui-pdp-price__part__container');
      if (partContainers.length > 1) {
        const ouLabel = Array.from(subtitlesEl.querySelectorAll('span')).find(
          el => el.textContent?.trim().toLowerCase() === 'ou'
        );
        const ouWrapper = ouLabel?.closest('.ui-pdp-price__subtitle > span') as HTMLElement | null;
        (ouWrapper || ouLabel)?.remove();
        partContainers[0].remove();
      }

      // Find installment fraction
      const instFraction = subtitlesEl.querySelector('.ui-pdp-price__part .andes-money-amount__fraction');
      if (instFraction) instFraction.textContent = instFmt.integer;
      const instCents = subtitlesEl.querySelector('.ui-pdp-price__part .andes-money-amount__cents');
      if (instCents) {
        if (instFmt.cents !== '00') { instCents.textContent = instFmt.cents; (instCents as HTMLElement).style.display = ''; }
        else { (instCents as HTMLElement).style.display = 'none'; }
      }
      const instSymbols = subtitlesEl.querySelectorAll('.andes-money-amount__currency-symbol');
      instSymbols.forEach(s => s.textContent = currencySymbol);

      const isDesktopView = window.innerWidth >= 768;

      // Update "Nx" text and apply colors
      const textNodes = subtitlesEl.querySelectorAll('span');
      let installmentCountSpan: HTMLElement | null = null;
      textNodes.forEach(span => {
        const t = span.textContent?.trim();

        if (t && /^\d+x\s*$/.test(t)) {
          installmentCountSpan = span as HTMLElement;
          span.textContent = `${maxInst}x `;
          (span as HTMLElement).style.color = '#00a650';
        }

        if (t === 'sem juros' && hasInterest) {
          span.textContent = '';
        } else if (t === 'sem juros') {
          (span as HTMLElement).style.color = '#00a650';
        }
      });

      // Ensure a whitespace text node separates the "em" wrapper from the "Nx" span
      // so they don't render glued together ("em12x" → "em 12x").
      if (installmentCountSpan) {
        const prev = (installmentCountSpan as HTMLElement).previousSibling;
        const hasSpace = prev && prev.nodeType === Node.TEXT_NODE && /\s/.test(prev.nodeValue || '');
        if (!hasSpace) {
          (installmentCountSpan as HTMLElement).parentElement?.insertBefore(
            document.createTextNode(' '),
            installmentCountSpan
          );
        }
      }

      // Desktop only: ensure "em" appears before installment count with dark color
      if (isDesktopView && installmentCountSpan) {
        const parent = installmentCountSpan.parentElement;
        if (parent) {
          let prefix = parent.querySelector('.ml-installment-prefix-em') as HTMLSpanElement | null;

          if (!prefix) {
            const existingPrefix = Array.from(parent.querySelectorAll('span')).find(
              (el) => el.textContent?.trim().toLowerCase() === 'em'
            ) as HTMLSpanElement | undefined;
            if (existingPrefix) {
              existingPrefix.classList.add('ml-installment-prefix-em');
              prefix = existingPrefix;
            }
          }

          if (!prefix) {
            prefix = document.createElement('span');
            prefix.className = 'ml-installment-prefix-em';
            parent.insertBefore(prefix, installmentCountSpan);
            parent.insertBefore(document.createTextNode(' '), installmentCountSpan);
          }

          prefix.textContent = 'em';
          prefix.style.color = 'rgba(0,0,0,0.9)';
        }
      }

      // Apply green color to the installment price amount
      const instAmount = subtitlesEl.querySelector('.ui-pdp-price__part .andes-money-amount');
      if (instAmount) (instAmount as HTMLElement).style.color = '#00a650';
    }
  }

  // Sales count - target the inner span, not the container div
  const salesSpan = container.querySelector('.ui-pdp-subtitle');
  if (salesSpan) {
    const totalSales = product.sales + product.fake_orders;
    const condText = product.condition === 'new' ? 'Novo' : 'Usado';
    if (totalSales > 0) {
      const salesLabel = totalSales > 10000 
        ? `${condText}  |  +${Math.floor(totalSales / 1000)}mil vendidos`
        : `${condText}  |  ${totalSales} vendidos`;
      salesSpan.textContent = salesLabel;
      salesSpan.setAttribute('aria-label', salesLabel);
    } else {
      salesSpan.textContent = condText;
      salesSpan.setAttribute('aria-label', condText);
    }
  }

  // Stock - update quantity available text
  const stockEl = container.querySelector('.ui-pdp-buybox__quantity__available');
  if (stockEl) {
    stockEl.textContent = `(${product.stock} disponíveis)`;
  }
  // Mobile: update "(+XX disponíveis)" in quantity selector
  const mobileStockSpan = container.querySelector('.ui-pdp-action-row__subtitle span');
  if (mobileStockSpan) {
    mobileStockSpan.textContent = `(+${product.stock} disponíveis)`;
  }

  // Inject shipping data
  injectShippingData(container, deliverySettings);
}

const StoreProduct = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const currency = 'BRL';
  const { addToCart: storeAddToCart } = useStore();
  const { mascara } = useMascara();
  const footerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [isMobileReady, setIsMobileReady] = useState(false);
  const [isMobileState, setIsMobileState] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [productNotFound, setProductNotFound] = useState(false);
  const [antiLanding, setAntiLanding] = useState(false);
  const [antiProductData, setAntiProductData] = useState<ProductData | null>(null);
  const [crawlerCaptcha, setCrawlerCaptcha] = useState(false);
  const [crawlerProductData, setCrawlerProductData] = useState<ProductData | null>(null);
  const [cardSettings, setCardSettings] = useState<CardSettings>({ enabled: false, max_installments: 12, monthly_rate: 1.99, free_installments: 3 });
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [cartDrawerProduct, setCartDrawerProduct] = useState<{ name: string; image: string; price: number; quantity: number } | null>(null);
  const [pageReady, setPageReady] = useState(false);

  // Fetch product and settings in parallel
  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    const loadData = async () => {
      try {
        const [prodRes, settingsRes] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .maybeSingle(),
          supabase
            .from('settings')
            .select('*')
            .in('key', ['card_settings', 'delivery_settings']),
        ]);

        if (!isMounted) return;

        const prod = prodRes.data;
        if (!prod || prod.status === 'inactive' || prod.status?.toLowerCase() === 'inativo') {
          setProductNotFound(true);
          return;
        }

        // Apply settings
        if (settingsRes.data) {
          for (const item of settingsRes.data) {
            if (item.key === 'card_settings' && item.value) {
              const v = item.value as any;
              setCardSettings({
                enabled: v.enabled ?? false,
                max_installments: v.max_installments ?? 12,
                monthly_rate: v.monthly_rate ?? 1.99,
                free_installments: v.free_installments ?? 3,
              });
            } else if (item.key === 'delivery_settings' && item.value) {
              const v = item.value as any;
              setDeliverySettings({
                delivery_days_min: v.delivery_days_min ?? 3,
                delivery_days_max: v.delivery_days_max ?? 7,
                is_free_shipping: v.is_free_shipping ?? false,
              });
            }
          }
        }

        const s = prod.status?.toLowerCase() || '';
        const isAnti = s === 'anti-google v1' || s === 'anti-google-v1' || s === 'anti-meta v1' || s === 'anti-meta-v1' || s === 'anti-meta-ads-v1';
        const isCrawler = s === 'anti-crawler-v1' || s === 'anti-crawler v1';

        const { data: variants } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', prod.id);

        if (!isMounted) return;

        const fullProduct = { ...prod, variants: variants || [] } as any;

        if (isAnti) {
          setAntiProductData(fullProduct);
          setAntiLanding(true);
        } else if (isCrawler) {
          setCrawlerProductData(fullProduct);
          setCrawlerCaptcha(true);
        } else {
          setProduct(fullProduct);
          // Track view_content
          if ((window as any).__trackEvent) {
            (window as any).__trackEvent("view_content", {
              content_name: fullProduct.name,
              content_ids: [fullProduct.id],
              value: fullProduct.price,
              currency: "BRL",
            });
          }
        }

        // Save viewed product to localStorage for recommendations
        try {
          const viewed: string[] = JSON.parse(localStorage.getItem('viewed_products') || '[]');
          const filtered = viewed.filter((s: string) => s !== slug);
          filtered.unshift(slug);
          localStorage.setItem('viewed_products', JSON.stringify(filtered.slice(0, 10)));
        } catch {}
      } catch (err) {
        console.error("Error loading product data:", err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobileState(mobile);
    setIsMobileReady(true);
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobileState(window.innerWidth < 768);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Mark page as ready shortly after product loads so content renders before loader hides
  useEffect(() => {
    if (!product) {
      setPageReady(false);
      return;
    }
    // If coming from anti landing or crawler captcha, skip the loader entirely
    if (antiProductData || crawlerProductData) {
      setPageReady(true);
      return;
    }
    const t = setTimeout(() => setPageReady(true), 150);
    return () => clearTimeout(t);
  }, [product, antiProductData, crawlerProductData]);

  // Update document title to the product name
  useEffect(() => {
    const activeProduct = product || antiProductData || crawlerProductData;
    if (activeProduct?.name) {
      document.title = "Loja Online";
    }
  }, [product, antiProductData, crawlerProductData]);

  const isMobile = isMobileState;

  const sanitizedMobileHtml = useMemo(() => processHtml(mobileProductHtml), []);
  const sanitizedDesktopHtml = useMemo(() => processHtml(desktopProductHtml), []);

  // Get currency symbol
  const currencySymbolMap: Record<string, string> = {
    BRL: 'R$', USD: '$', EUR: '€', ARS: '$', BOB: 'Bs', CLP: '$', COP: '$',
    CRC: '₡', DOP: 'RD$', GTQ: 'Q', HNL: 'L', MXN: '$', NIO: 'C$',
    PAB: 'B/.', PYG: '₲', PEN: 'S/', UYU: '$U', VES: 'Bs.D', GBP: '£',
  };
  const currencySymbol = currencySymbolMap[currency] || 'R$';




  // Inject desktop-only CSS links + inline styles
  useEffect(() => {
    if (isMobile) return;
    const links: HTMLLinkElement[] = [];
    DESKTOP_CSS_URLS.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (existing) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.media = "screen and (min-width: 768px)";
      document.head.appendChild(link);
      links.push(link);
    });

    const style = document.createElement("style");
    style.id = "pdp-desktop-inline-styles";
    style.textContent = PDP_DESKTOP_STYLES;
    document.head.appendChild(style);

    return () => {
      links.forEach((l) => l.remove());
      style.remove();
    };
  }, [isMobile]);

  // Inject mobile-only CSS
  useEffect(() => {
    if (!isMobile) return;
    const links: HTMLLinkElement[] = [];
    MOBILE_CSS_URLS.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (existing) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
      links.push(link);
    });

    const style = document.createElement("style");
    style.id = "pdp-mobile-inline-styles";
    style.textContent = PDP_MOBILE_STYLES;
    document.head.appendChild(style);

    return () => {
      links.forEach((l) => l.remove());
      style.remove();
    };
  }, [isMobile]);

  // Desktop footer portal
  useEffect(() => {
    if (isMobile) return;
    const mainEl = document.getElementById("root-app");
    if (!mainEl || !mainEl.parentNode) return;
    const existing = document.getElementById("product-footer-portal");
    if (existing) { setPortalContainer(existing); return; }
    const container = document.createElement("div");
    container.id = "product-footer-portal";
    container.className = "hidden md:contents";
    mainEl.parentNode.insertBefore(container, mainEl.nextSibling);
    setPortalContainer(container);
    return () => { container.remove(); };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const container = footerRef.current;
    if (!container) return;
    const switchBtn = container.querySelector("#nav-footer-access-switch");
    const accessDiv = container.querySelector(".nav-footer-access");
    if (!switchBtn || !accessDiv) return;
    const handler = () => {
      if (accessDiv.classList.contains("nav-footer-access-collapsed")) {
        accessDiv.classList.remove("nav-footer-access-collapsed");
        accessDiv.classList.add("nav-footer-access-expanded");
        switchBtn.setAttribute("aria-expanded", "true");
      } else {
        accessDiv.classList.remove("nav-footer-access-expanded");
        accessDiv.classList.add("nav-footer-access-collapsed");
        switchBtn.setAttribute("aria-expanded", "false");
      }
    };
    switchBtn.addEventListener("click", handler);
    return () => switchBtn.removeEventListener("click", handler);
  }, [portalContainer, isMobile]);

  // Mobile: collapsible sections interactivity
  const mobileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMobile) return;
    const container = mobileRef.current;
    if (!container) return;

    // Remove all href attributes from elements inside mobile main (except <use> and <link>)
    container.querySelectorAll('[href]').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag !== 'use' && tag !== 'link') {
        el.removeAttribute('href');
      }
    });

    // Remove "Ver características" link and replace with GroupedShareBookmark block
    const seeMoreBtn = container.querySelector('#see-more-button-hs-features');
    if (seeMoreBtn) {
      const replacement = document.createElement('div');
      replacement.id = 'GroupedShareBookmark';
      replacement.style.margin = '0';
      replacement.className = 'ui-pdp-container__col col-1 ui-pdp-with--separator ui-pdp-with--separator--medium-top mt-20';
      seeMoreBtn.parentNode?.replaceChild(replacement, seeMoreBtn);
    }

    // "Ver descrição completa" – expand description (event delegation for dynamic content)
    const descHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      // Match by attribute, class, or text content
      const descAction = target.closest<HTMLElement>('a[data-testid="action-collapsable-target"], a.ui-pdp-collapsable__action') ||
        (target.closest('a') && target.closest('a')?.textContent?.trim().includes('Ver descrição completa') ? target.closest<HTMLElement>('a') : null);
      if (!descAction || !container.contains(descAction)) return;
      e.preventDefault();
      e.stopPropagation();
      const collapsable = descAction.closest<HTMLElement>('.ui-pdp-collapsable') ||
        descAction.parentElement?.closest<HTMLElement>('.ui-pdp-collapsable') ||
        container.querySelector<HTMLElement>('.ui-pdp-collapsable--is-collapsed');
      if (collapsable) {
        collapsable.classList.remove('ui-pdp-collapsable--is-collapsed');
        collapsable.style.maxHeight = 'none';
        collapsable.style.overflow = 'visible';
        const inner = collapsable.querySelector<HTMLElement>('.ui-pdp-collapsable__container');
        if (inner) {
          inner.style.maxHeight = 'none';
          inner.style.overflow = 'visible';
        }
      }
      descAction.remove();
    };
    container.addEventListener('click', descHandler);

    // "Conferir todas as características" – expand specs
    const specsLink = container.querySelector<HTMLElement>('.ui-vpp-highlighted-specs__see-more .ui-pdp-action-modal__link');
    if (specsLink) {
      const handler = (e: Event) => {
        e.preventDefault();
        // Find the parent see-more row and hide it
        const seeMoreRow = specsLink.closest('.ui-pdp-container__row--technical-specifications');
        if (seeMoreRow) (seeMoreRow as HTMLElement).style.display = 'none';
        // Find the highlighted specs section and expand any collapsed content
        const specsSection = container.querySelector('#highlighted_specs_attrs');
        if (specsSection) {
          const collapsed = specsSection.querySelectorAll<HTMLElement>('.ui-vpp-highlighted-specs__striped-specs--collapsed');
          collapsed.forEach(el => {
            el.classList.remove('ui-vpp-highlighted-specs__striped-specs--collapsed');
            el.style.maxHeight = 'none';
          });
        }
      };
      specsLink.addEventListener('click', handler);
    }
  }, [isMobile, sanitizedMobileHtml]);

  // Mobile: hide highlighted_specs_attrs section and first hr if result12 is empty after 2.5s
  useEffect(() => {
    if (!isMobile || !product) return;
    const container = mobileRef.current;
    if (!container) return;

    const timeout = setTimeout(() => {
      const result12 = container.querySelector('#result12');
      if (result12 && result12.children.length === 0) {
        const specsSection = container.querySelector<HTMLElement>('section#highlighted_specs_attrs');
        if (specsSection) {
          specsSection.style.setProperty('display', 'none', 'important');
        }
        const firstHr = container.querySelector<HTMLElement>('hr.ui-pdp-hr');
        if (firstHr) {
          firstHr.style.setProperty('display', 'none', 'important');
        }
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [isMobile, product]);


  const [reviewLightbox, setReviewLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Review image lightbox - works on both mobile and desktop
  useEffect(() => {
    if (!product) return;
    const container = isMobile ? mobileRef.current : desktopRef.current;
    if (!container) return;

    // Find all review images in the reviews section
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const img = target.closest('img') || (target.tagName === 'IMG' ? target : null);
      if (!img) return;

      // Check if this image is inside a review area
      const reviewContainer = (img as HTMLElement).closest('#result16, #result17, .ui-review-capability__reviews-carousel, .ui-review-capability-comments, [class*="review"]');
      if (!reviewContainer) return;

      e.preventDefault();
      e.stopPropagation();

      // Collect all review images from the reviews section
      const allReviewImgs: string[] = [];
      container.querySelectorAll('#result16 img, #result17 img, .ui-review-capability__reviews-carousel img, .ui-review-capability-comments img').forEach(i => {
        const src = (i as HTMLImageElement).src || (i as HTMLImageElement).getAttribute('data-src');
        if (src && !allReviewImgs.includes(src)) allReviewImgs.push(src);
      });

      const clickedSrc = (img as HTMLImageElement).src || (img as HTMLImageElement).getAttribute('data-src') || '';
      const clickedIndex = allReviewImgs.indexOf(clickedSrc);

      if (allReviewImgs.length > 0) {
        setReviewLightbox({ images: allReviewImgs, index: Math.max(0, clickedIndex) });
      }
    };

    container.addEventListener('click', handler);
    return () => container.removeEventListener('click', handler);
  }, [isMobile, product, sanitizedMobileHtml]);

  // Mobile: quantity selector popup
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    if (!isMobile || !product) return;
    const container = mobileRef.current;
    if (!container) return;
    const qtyRow = container.querySelector('#buybox_available_quantity') || container.querySelector('.ui-pdp-action-row');
    if (!qtyRow) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setShowQuantityModal(true);
    };
    qtyRow.addEventListener('click', handler);
    return () => qtyRow.removeEventListener('click', handler);
  }, [isMobile, product, sanitizedMobileHtml]);

  // Update quantity text in DOM when selectedQty changes
  useEffect(() => {
    if (!isMobile || !product) return;
    const container = mobileRef.current;
    if (!container) return;
    const qtyTitle = container.querySelector('.ui-pdp-action-row__title');
    if (qtyTitle) {
      qtyTitle.textContent = `${selectedQty} unidade${selectedQty > 1 ? 's' : ''}`;
    }
    const qtySelected = container.querySelector('.ui-pdp-action-row__selected span');
    if (qtySelected) {
      qtySelected.textContent = String(selectedQty);
    }
  }, [isMobile, product, selectedQty, sanitizedMobileHtml]);

  // Mobile: "Perguntar" button → popup
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  useEffect(() => {
    if (!isMobile) return;
    const container = mobileRef.current;
    if (!container) return;
    const perguntarBtn = container.querySelector<HTMLElement>('button.andes-button--loud.andes-button--full-width');
    if (!perguntarBtn) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      setShowQuestionsModal(true);
    };
    perguntarBtn.addEventListener('click', handler);
    return () => perguntarBtn.removeEventListener('click', handler);
  }, [isMobile, sanitizedMobileHtml]);

  // Share button click handler (mobile)
  useEffect(() => {
    if (!isMobile) return;
    const container = mobileRef.current;
    if (!container) return;
    const shareLink = container.querySelector('.ui-pdp-share__link') as HTMLElement | null;
    if (!shareLink) return;
    const handler = async (e: Event) => {
      e.preventDefault();
      const shareData = {
        title: product?.name || document.title,
        url: window.location.href,
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch {}
      } else {
        try {
          await copyToClipboard(window.location.href);
          alert('Link copiado!');
        } catch {}
      }
    };
    shareLink.addEventListener('click', handler);
    return () => shareLink.removeEventListener('click', handler);
  }, [isMobile, product, sanitizedMobileHtml]);

  // Bookmark/favorite button handler (mobile) - runs after DOM injection
  useEffect(() => {
    if (!isMobile) return;
    const container = mobileRef.current;
    if (!container) return;
    // Delay to ensure injectProductData has finished modifying the DOM
    const timeout = setTimeout(() => {
      const bookmarkBtns = container.querySelectorAll('button.ui-pdp-bookmark__link-bookmark') as NodeListOf<HTMLElement>;
      const targets = Array.from(bookmarkBtns);
      if (targets.length === 0) return;
      let favorited = false;
      targets.forEach(target => {
        const handler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          favorited = !favorited;
          // Apply to ALL bookmark buttons so they stay in sync
          targets.forEach(t => {
            const svgs = t.querySelectorAll('svg.ui-pdp-icon--bookmark') as NodeListOf<SVGElement>;
            svgs.forEach(svg => {
              svg.style.fill = favorited ? '#3483fa' : '';
              svg.style.color = favorited ? '#3483fa' : '';
            });
            t.setAttribute('aria-checked', String(favorited));
          });
          target.style.animation = 'bookmark-pulse 0.4s ease-out';
          target.addEventListener('animationend', () => {
            target.style.animation = '';
          }, { once: true });
        };
        target.addEventListener('click', handler);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [isMobile, sanitizedMobileHtml, product]);

  // Inject real product data into DOM (mobile)
  useEffect(() => {
    if (!isMobile || !product) return;
    const container = mobileRef.current;
    if (!container) return;
    injectProductData(container, product, cardSettings, currencySymbol, deliverySettings);
  }, [isMobile, product, cardSettings, currencySymbol, sanitizedMobileHtml, deliverySettings]);

  // Always ensure shipping dates are updated immediately to current date on mount (mobile & desktop)
  useEffect(() => {
    const container = isMobile ? mobileRef.current : desktopRef.current;
    if (container) {
      injectShippingData(container, deliverySettings);
    }
  }, [isMobile, deliverySettings, sanitizedMobileHtml, sanitizedDesktopHtml]);

  // Mobile: populate "Quem viu este produto também comprou" with products sharing tags
  useEffect(() => {
    if (!isMobile || !product) return;
    const container = mobileRef.current;
    if (!container) return;

    // Use a small delay to ensure DOM is fully rendered
    const timeout = setTimeout(() => {
      // Find the specific "Quem viu este produto também comprou" section
      const allRecoSections = container.querySelectorAll('.ui-recommendations-carousel-wrapper-ref') as NodeListOf<HTMLElement>;
      let recoSection: HTMLElement | null = null;
      allRecoSections.forEach(section => {
        const titleEl = section.querySelector('h2, .ui-recommendations-title-link, .ui-recommendations-title');
        const text = titleEl?.textContent?.toLowerCase() || '';
        if (text.includes('também comprou') || text.includes('tambem comprou')) {
          recoSection = section;
        } else {
          section.style.display = 'none';
        }
      });

      if (!recoSection) {
        // If no specific section found, try the first one
        if (allRecoSections.length > 0) {
          recoSection = allRecoSections[0];
          // Hide all others
          allRecoSections.forEach((s, i) => { if (i > 0) s.style.display = 'none'; });
        } else {
          return;
        }
      }

      const currentTags: string[] = Array.isArray((product as any).tags) ? ((product as any).tags as string[]) : [];
      if (currentTags.length === 0) {
        (recoSection as HTMLElement).style.display = 'none';
        return;
      }

      const targetSection = recoSection as HTMLElement;

      const fetchRelated = async () => {
        const { data: allProducts } = await supabase
          .from('products')
          .select('id, name, slug, price, compare_price, image, tags, enable_pix, enable_boleto')
          .neq('id', product.id);

        if (!allProducts || allProducts.length === 0) {
          targetSection.style.display = 'none';
          return;
        }

        // Filter products that share at least one tag with current product
        const related = allProducts.filter(p => {
          const pTags: string[] = Array.isArray(p.tags) ? (p.tags as string[]) : [];
          return pTags.some(t => currentTags.includes(t));
        });

        if (related.length < 1) {
          targetSection.style.display = 'none';
          return;
        }

        // Show the section
        targetSection.style.display = '';

        // Find or create carousel list
        let carousel = targetSection.querySelector('.andes-carousel-free__list') as HTMLElement | null;
        if (!carousel) {
          // Create the carousel structure if it doesn't exist
          let carouselFree = targetSection.querySelector('.andes-carousel-free') as HTMLElement | null;
          if (!carouselFree) {
            const header = targetSection.querySelector('.ui-recommendations-carousel-free__header, .ui-recommendations-title');
            const wrapper = document.createElement('div');
            wrapper.className = 'ui-recommendations-carousel-free mb-24 mt-16';
            wrapper.style.cssText = '--carousel-free-padding: 16px;';

            if (!header) {
              const titleDiv = document.createElement('div');
              titleDiv.className = 'ui-recommendations-carousel-free__header';
              titleDiv.innerHTML = '<div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Quem viu este produto também comprou</h2></div>';
              wrapper.appendChild(titleDiv);
            }

            carouselFree = document.createElement('div');
            carouselFree.className = 'andes-carousel-free';
            wrapper.appendChild(carouselFree);
            targetSection.appendChild(wrapper);
          }
          carousel = document.createElement('ul');
          carousel.className = 'andes-carousel-free__list andes-carousel-free__list--spacing-12';
          carousel.setAttribute('aria-label', 'Quem viu este produto também comprou');
          carouselFree.appendChild(carousel);
        }

        carousel.innerHTML = '';

        related.forEach(p => {
          const priceFmt = formatPrice(p.price, currencySymbol);
          const discount = calcDiscount(p.compare_price, p.price);
          const compareFmt = formatPrice(p.compare_price, currencySymbol);

          let priceHtml = '';
          if (discount > 0) {
            priceHtml = `
              <s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size: 12px;" data-andes-money-amount="true" data-andes-money-amount-size="12">
                <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
                <span class="andes-money-amount__fraction">${compareFmt.integer}</span>${centsSuffixHtml(compareFmt.cents, 12)}
              </s>
              <div class="poly-price__current">
                <span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size: 20px;" data-andes-money-amount="true" data-andes-money-amount-size="20">
                  <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
                  <span class="andes-money-amount__fraction">${priceFmt.integer}</span>${centsSuffixHtml(priceFmt.cents, 20)}
                </span>
                <span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">${discount}% OFF</span>
              </div>`;
          } else {
            priceHtml = `
              <div class="poly-price__current">
                <span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size: 20px;" data-andes-money-amount="true" data-andes-money-amount-size="20">
                  <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
                  <span class="andes-money-amount__fraction">${priceFmt.integer}</span>${centsSuffixHtml(priceFmt.cents, 20)}
                </span>
              </div>`;
          }

          if (cardSettings.enabled) {
            const installment = calcInstallment(p.price, cardSettings.free_installments, cardSettings.monthly_rate, cardSettings.free_installments);
            const installFmt = formatPrice(installment.value, currencySymbol);
            priceHtml += `<span class="poly-price__installments"><span style="color:rgba(0,0,0,0.9)">em</span> <span style="color:#00a650">${cardSettings.free_installments}x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size: inherit;">
              <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
              <span class="andes-money-amount__fraction">${installFmt.integer}</span><span>,</span><span class="andes-money-amount__cents">${installFmt.cents}</span>
            </span> sem juros</span></span>`;
          } else {
            const rp = p as any;
            const hasPix = rp.enable_pix === true;
            const hasBoleto = rp.enable_boleto === true;
            let avistaText = 'À vista';
            if (hasPix && hasBoleto) avistaText = 'À vista no Pix e Boleto';
            else if (hasPix) avistaText = 'À vista no Pix';
            else if (hasBoleto) avistaText = 'À vista no Boleto';
            priceHtml += `<span class="poly-price__installments" style="color: rgb(0, 166, 80); font-weight: 600;">${avistaText}</span>`;
          }

          const li = document.createElement('li');
          li.className = 'andes-carousel-free__slide';
          li.innerHTML = `
            <div class="poly-andes-card poly-andes-card--flat recos-polycard poly-card poly-card--grid-card poly-card--large" style="cursor:pointer" data-reco-slug="${p.slug}">
              <div class="poly-card__portada" style="display: flex; align-items: center; justify-content: center; padding: 8px;">
                <span class="poly-component__image-overlay"></span>
                <img class="poly-component__picture" alt="${p.name}" loading="lazy" decoding="async" src="${p.image || '/placeholder.svg'}" style="object-fit: contain; width: 100%; height: 150px; max-width: 150px; max-height: 150px; object-position: center; display: block; margin: 0 auto;">
              </div>
              <div class="poly-card__content">
                <a class="poly-component__title">${p.name}</a>
                <div class="poly-component__price">${priceHtml}</div>
                <div class="poly-component__shipping"><span>Frete grátis</span></div>
              </div>
            </div>`;

          li.addEventListener('click', () => {
            if ((window as any).spaNavigate) {
              (window as any).spaNavigate(`/store/product/${p.slug}`);
            } else {
              window.location.href = `/store/product/${p.slug}`;
            }
          });

          carousel!.appendChild(li);
        });
      };

      fetchRelated();
    }, 500);

    return () => clearTimeout(timeout);
  }, [isMobile, product, cardSettings, currencySymbol, sanitizedMobileHtml]);

  // Mobile: inject variants block above price
  useEffect(() => {
    if (!isMobile || !product) return;
    const container = mobileRef.current;
    if (!container) return;
    const p = product as any;
    const variants = p.variants || [];
    
    // Remove any previously injected variants block
    container.querySelectorAll('.ui-pdp-variants-injected').forEach(el => el.remove());
    
    if (variants.length === 0) return;

    // Group variants by group_name
    const groups: Record<string, Array<{ option_name: string; id: string; image?: string }>> = {};
    variants.forEach((v: any) => {
      if (!groups[v.group_name]) groups[v.group_name] = [];
      groups[v.group_name].push(v);
    });

    // Build HTML
    let pickersHtml = '';
    Object.entries(groups).forEach(([groupName, options]) => {
      const hasMultipleOptions = options.length > 1;
      const firstOption = options[0];
      const hasImages = options.some((opt: any) => opt.image);
      
      if (hasMultipleOptions) {
        if (hasImages) {
          // Template with images (thumbnail cards with image, label, price, stock)
          const itemsHtml = options.map((opt: any) => {
            const optFmt = formatPrice(opt.price || 0, currencySymbol);
            const ariaLabel = optFmt.cents === '00'
              ? `${optFmt.integer} reais`
              : `${optFmt.integer} reais com ${optFmt.cents} centavos`;
            return `
            <li>
              <a class="ui-pdp-outside_variations__thumbnails__item ui-pdp-outside_variations__thumbnails__item--NONE ui-pdp-outside_variations__thumbnails__item--with-picture ui-pdp-outside_variations__thumbnails__item--with-price"
                 data-testid="thumbnail-item" role="button" data-variant-id="${opt.id}"
                 modifier="link">
                <img class="ui-pdp-image ui-pdp-outside_variations__thumbnails__item__picture" decoding="async" alt="${opt.option_name}" loading="eager" src="${opt.image}" />
                <p class="ui-pdp-color--BLACK ui-pdp-outside_variations__thumbnails__item__label">
                  <span>${opt.option_name}</span>
                </p>
                <div class="ui-pdp-price ui-pdp-outside_variations__thumbnails__item__price mt-24 ui-pdp-price--size-small">
                  <div class="ui-pdp-price__main-container">
                    <div class="ui-pdp-price__second-line">
                      <span data-testid="price-part" class="ui-pdp-price__part__container">
                        <span class="andes-money-amount ui-pdp-price__part andes-money-amount--cents-comma andes-money-amount--compact" role="img" aria-label="${ariaLabel}" style="font-size: 12px;" data-andes-money-amount="true" data-andes-money-amount-size="12">
                          <span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span>
                          <span class="andes-money-amount__fraction" aria-hidden="true">${optFmt.integer}</span>${centsSuffixHtml(optFmt.cents, 12)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <p class="ui-pdp-color--GRAY ui-pdp-outside_variations__thumbnails__item__stock">
                  <span>${(opt.stock ?? 0) > 0 ? 'Disponível' : 'Indisponível'}</span>
                </p>
              </a>
            </li>
          `;
          }).join('');

          pickersHtml += `
            <div class="ui-pdp-outside_variations__picker" data-testid="PICKER-${groupName.toUpperCase().replace(/\s+/g, '_')}">
              <p class="ui-pdp-outside_variations__title">
                <span class="ui-pdp-outside_variations__title__label ui-pdp-color--BLACK">${groupName}:</span>
                <span class="ui-pdp-outside_variations__title__value ui-pdp-color--BLACK">Escolha</span>
              </p>
              <ul class="ui-pdp-outside_variations__items ui-pdp-outside_variations__thumbnails">
                ${itemsHtml}
              </ul>
            </div>
          `;
        } else {
          // Template without images (text-only buttons)
          const itemsHtml = options.map(opt => `
            <li>
              <a class="ui-pdp-outside_variations__thumbnails__item ui-pdp-outside_variations__thumbnails__item--NONE"
                 data-testid="thumbnail-item" role="button" data-variant-id="${opt.id}"
                 modifier="link">
                <p class="ui-pdp-color--BLACK ui-pdp-outside_variations__thumbnails__item__label">
                  <span>${opt.option_name}</span>
                </p>
              </a>
            </li>
          `).join('');

          pickersHtml += `
            <div class="ui-pdp-outside_variations__picker">
              <p class="ui-pdp-outside_variations__title">
                <span class="ui-pdp-outside_variations__title__label ui-pdp-color--BLACK">${groupName}: </span>
                <span class="ui-pdp-outside_variations__title__value ui-pdp-color--BLACK">Escolha</span>
              </p>
              <ul class="ui-pdp-outside_variations__items ui-pdp-outside_variations__thumbnails">
                ${itemsHtml}
              </ul>
            </div>
          `;
        }
      } else {
        pickersHtml += `
          <div class="ui-pdp-outside_variations__picker">
            <p class="ui-pdp-outside_variations__title">
              <span class="ui-pdp-outside_variations__title__label ui-pdp-color--BLACK">${groupName}: </span>
              <span class="ui-pdp-outside_variations__title__value ui-pdp-color--BLACK">${firstOption.option_name}</span>
            </p>
          </div>
        `;
      }
    });

    const variantsHtml = `
      <div class="ui-pdp-container__row mt-16 ui-pdp-variants-injected">
        <div class="ui-pdp-outside_variations pl-16 pr-16">
          ${pickersHtml}
        </div>
      </div>
    `;

    // Find price container and insert before it
    const priceContainer = container.querySelector('.ui-pdp-price') || container.querySelector('.ui-pdp-price__main-container');
    if (priceContainer && priceContainer.parentElement) {
      priceContainer.insertAdjacentHTML('beforebegin', variantsHtml);
    }

    // Add click handlers for variant selection
    container.querySelectorAll('.ui-pdp-variants-injected .ui-pdp-outside_variations__thumbnails__item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const picker = item.closest('.ui-pdp-outside_variations__picker');
        if (!picker) return;
        // Remove selected from all items in this picker
        picker.querySelectorAll('.ui-pdp-outside_variations__thumbnails__item').forEach(i => {
          i.classList.remove('ui-pdp-outside_variations__thumbnails__item--SELECTED');
          i.classList.add('ui-pdp-outside_variations__thumbnails__item--NONE');
        });
        // Add selected to clicked
        item.classList.remove('ui-pdp-outside_variations__thumbnails__item--NONE');
        item.classList.add('ui-pdp-outside_variations__thumbnails__item--SELECTED');
        // Update title value
        const titleValue = picker.querySelector('.ui-pdp-outside_variations__title__value');
        const optionLabel = item.querySelector('.ui-pdp-outside_variations__thumbnails__item__label span');
        if (titleValue && optionLabel) {
          titleValue.textContent = optionLabel.textContent || '';
        }
        const variantImg = item.querySelector('img.ui-pdp-outside_variations__thumbnails__item__picture') as HTMLImageElement | null;
        // Re-render price/installments with the selected variant's price & stock
        const variantId = item.getAttribute('data-variant-id');
        if (variantId) {
          const matched = ((product as any).variants || []).find((v: any) => v.id === variantId);
          if (matched) {
            const effectivePrice = matched.price > 0 ? matched.price : (product as any).price;
            const effectiveStock = matched.stock > 0 ? matched.stock : (product as any).stock;
            injectProductData(
              container,
              { ...product, price: effectivePrice, stock: effectiveStock } as any,
              cardSettings,
              currencySymbol,
              deliverySettings
            );
          }
        }
        // Swap main gallery image if variant has image (AFTER injectProductData to not be overwritten)
        if (variantImg && variantImg.src) {
          const galleryImgs = container.querySelectorAll<HTMLImageElement>(
            'img.ui-pdp-image.ui-pdp-gallery--horizontal, img.ui-pdp-image.ui-pdp-gallery__figure__image'
          );
          galleryImgs.forEach(mainImg => {
            mainImg.src = variantImg.src;
            mainImg.setAttribute('src', variantImg.src);
            mainImg.removeAttribute('srcset');
            if (mainImg.hasAttribute('data-zoom')) mainImg.setAttribute('data-zoom', variantImg.src);
          });
        }
      });
    });
  }, [isMobile, product, sanitizedMobileHtml, currencySymbol, cardSettings, deliverySettings]);


  useEffect(() => {
    if (!isMobile || !product) return;
    const container = mobileRef.current;
    if (!container) return;

    const gallery = container.querySelector('.ui-pdp-container__row.ui-pdp-container__row--gallery');
    if (!gallery) return;

    const slidesWrapper = gallery.querySelector('.andes-carousel-snapped__wrapper, .andes-carousel-snapped__slides') as HTMLElement | null;
    if (!slidesWrapper) return;

    const slides = gallery.querySelectorAll('.andes-carousel-snapped__slide');
    const visibleSlides = Array.from(slides).filter(s => (s as HTMLElement).style.display !== 'none');
    if (visibleSlides.length <= 1) return;

    // Set initial counter total
    const counterElInit = gallery.querySelector('.ui-pdp-carousel-snapped__counter');
    if (counterElInit) {
      const totalSpan = counterElInit.querySelector('.pagination-total');
      if (totalSpan) totalSpan.textContent = String(visibleSlides.length);
      const currentSpan = counterElInit.querySelector('.pagination-current');
      if (currentSpan) currentSpan.textContent = '1';
    }

    let currentIndex = 0;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let isHorizontal: boolean | null = null;

    const updateSlide = (idx: number) => {
      currentIndex = Math.max(0, Math.min(idx, visibleSlides.length - 1));
      
      // Update slide visibility via transform
      const slideWidth = (visibleSlides[0] as HTMLElement).offsetWidth;
      slidesWrapper.style.transition = 'transform 0.3s ease';
      slidesWrapper.style.transform = `translate3d(-${currentIndex * slideWidth}px, 0, 0)`;

      // Update active classes
      visibleSlides.forEach((s, i) => {
        s.classList.toggle('andes-carousel-snapped__slide--active', i === currentIndex);
        s.classList.remove('andes-carousel-snapped__slide--next');
      });

      // Update dots
      const dotsContainer = gallery.querySelector('.dots-navigation, .andes-carousel-snapped__pagination');
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('li');
        dots.forEach((dot, i) => {
          const isActive = i === currentIndex;
          dot.classList.toggle('active', isActive);
          dot.classList.toggle('andes-carousel-snapped__dot--active', isActive);
          const span = dot.querySelector('span');
          if (span) span.className = isActive ? 'dots-navigation--active' : '';
        });
      }

      // Update counter (pagination-current / pagination-total)
      const counterEl = gallery.querySelector('.ui-pdp-carousel-snapped__counter');
      if (counterEl) {
        const currentSpan = counterEl.querySelector('.pagination-current');
        const totalSpan = counterEl.querySelector('.pagination-total');
        if (currentSpan) currentSpan.textContent = String(currentIndex + 1);
        if (totalSpan) totalSpan.textContent = String(visibleSlides.length);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      isHorizontal = null;
      slidesWrapper.style.transition = 'none';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      
      if (isHorizontal === null) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isHorizontal = Math.abs(dx) > Math.abs(dy);
        }
      }
      
      if (isHorizontal) {
        e.preventDefault();
        const slideWidth = (visibleSlides[0] as HTMLElement).offsetWidth;
        const offset = -currentIndex * slideWidth + dx;
        slidesWrapper.style.transform = `translate3d(${offset}px, 0, 0)`;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (!isHorizontal) return;
      
      const dx = e.changedTouches[0].clientX - startX;
      const threshold = 50;
      if (dx < -threshold) {
        updateSlide(currentIndex + 1);
      } else if (dx > threshold) {
        updateSlide(currentIndex - 1);
      } else {
        updateSlide(currentIndex);
      }
    };

    // Dots click handler
    const dotsContainer = gallery.querySelector('.dots-navigation, .andes-carousel-snapped__pagination');
    const onDotClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const dot = target.closest('li');
      if (!dot || !dotsContainer) return;
      const allDots = Array.from(dotsContainer.querySelectorAll('li'));
      const idx = allDots.indexOf(dot);
      if (idx >= 0) updateSlide(idx);
    };

    // Set initial layout for swipe
    slidesWrapper.style.display = 'flex';
    slidesWrapper.style.flexWrap = 'nowrap';
    
    visibleSlides.forEach(s => {
      (s as HTMLElement).style.minWidth = '100%';
      (s as HTMLElement).style.flexShrink = '0';
    });

    // Navigation control buttons
    let nextBtn = gallery.querySelector('button[data-andes-carousel-snapped-control="next"]') as HTMLElement | null;
    let prevBtn = gallery.querySelector('button[data-andes-carousel-snapped-control="prev"]') as HTMLElement | null;

    // Create prev button if it doesn't exist
    if (!prevBtn && nextBtn) {
      prevBtn = document.createElement('button');
      prevBtn.className = 'andes-carousel-snapped__control andes-carousel-snapped__control--prev andes-carousel-snapped__control--size-small';
      prevBtn.setAttribute('data-andes-carousel-snapped-control', 'prev');
      prevBtn.setAttribute('type', 'button');
      prevBtn.setAttribute('aria-label', 'Anterior');
      prevBtn.setAttribute('name', 'andes-carousel-snapped_control');
      prevBtn.innerHTML = '<svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.0497 11.5996L6.45333 8.0032L10.0535 4.4031L9.20494 3.55457L4.75627 8.0032L9.20119 12.4481L10.0497 11.5996Z" fill="currentColor"></path></svg>';
      nextBtn.parentElement?.insertBefore(prevBtn, nextBtn);
    }

    // Create next button if it doesn't exist
    if (!nextBtn) {
      const controlsContainer = gallery.querySelector('.andes-carousel-snapped__controls') || gallery;
      nextBtn = document.createElement('button');
      nextBtn.className = 'andes-carousel-snapped__control andes-carousel-snapped__control--next andes-carousel-snapped__control--size-small';
      nextBtn.setAttribute('data-andes-carousel-snapped-control', 'next');
      nextBtn.setAttribute('type', 'button');
      nextBtn.setAttribute('aria-label', 'Seguinte');
      nextBtn.setAttribute('name', 'andes-carousel-snapped_control');
      nextBtn.innerHTML = '<svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.95028 4.40041L9.54667 7.9968L5.94653 11.5969L6.79506 12.4455L11.2437 7.9968L6.79881 3.55188L5.95028 4.40041Z" fill="currentColor"></path></svg>';
      controlsContainer.appendChild(nextBtn);
    }

    const updateControlVisibility = () => {
      if (prevBtn) (prevBtn as HTMLElement).style.display = currentIndex === 0 ? 'none' : '';
      if (nextBtn) (nextBtn as HTMLElement).style.display = currentIndex >= visibleSlides.length - 1 ? 'none' : '';
    };

    // Extend updateSlide to also update controls
    const origUpdateSlide = updateSlide;
    const updateSlideWithControls = (idx: number) => {
      origUpdateSlide(idx);
      updateControlVisibility();
    };

    updateControlVisibility();

    const onNextClick = () => updateSlideWithControls(currentIndex + 1);
    const onPrevClick = () => updateSlideWithControls(currentIndex - 1);

    if (nextBtn) nextBtn.addEventListener('click', onNextClick);
    if (prevBtn) prevBtn.addEventListener('click', onPrevClick);

    // Also update controls after touch
    const onTouchEndWithControls = () => {
      setTimeout(updateControlVisibility, 50);
    };

    gallery.addEventListener('touchstart', onTouchStart, { passive: true });
    gallery.addEventListener('touchmove', onTouchMove, { passive: false });
    gallery.addEventListener('touchend', onTouchEnd, { passive: true });
    gallery.addEventListener('touchend', onTouchEndWithControls, { passive: true });
    if (dotsContainer) dotsContainer.addEventListener('click', onDotClick);

    return () => {
      gallery.removeEventListener('touchstart', onTouchStart);
      gallery.removeEventListener('touchmove', onTouchMove);
      gallery.removeEventListener('touchend', onTouchEnd);
      gallery.removeEventListener('touchend', onTouchEndWithControls);
      if (dotsContainer) dotsContainer.removeEventListener('click', onDotClick);
      if (nextBtn) nextBtn.removeEventListener('click', onNextClick);
      if (prevBtn) prevBtn.removeEventListener('click', onPrevClick);
    };
  }, [isMobile, product, sanitizedMobileHtml]);

  // Mobile: replace specific blocks with result placeholders + inject description content
  useEffect(() => {
    if (!isMobile) return;
    const container = mobileRef.current;
    if (!container) return;

    const mobileSelectorMap: { resultId: string; descSelector: string }[] = [
      { resultId: 'result10', descSelector: 'div.ui-pdp-header__info' },
      { resultId: 'result11', descSelector: 'section#ui-vpp-highlighted-specs' },
      { resultId: 'result12', descSelector: 'section#highlighted_specs_attrs' },
      { resultId: 'result13', descSelector: 'div#description' },
      { resultId: 'result14', descSelector: 'p.ui-review-capability__rating__average' },
      { resultId: 'result15', descSelector: 'p.ui-review-capability__rating__label' },
      { resultId: 'result16', descSelector: 'div.ui-review-capability__reviews-carousel' },
      { resultId: 'result17', descSelector: 'div.ui-review-capability-comments' },
    ];

    const doMobileReplace = () => {
      // result10: div.ui-pdp-header__product-classification
      const classificationBlock = container.querySelector('.ui-pdp-header__product-classification');
      if (classificationBlock && !container.querySelector('#result10')) {
        const div = document.createElement('div');
        div.id = 'result10';
        classificationBlock.replaceWith(div);
      }

      // result11: div with id="highlighted_specs_features"
      const specsFeatures = container.querySelector('#highlighted_specs_features') ||
        container.querySelector('.ui-pdp-container__row--highlighted-specs-features');
      if (specsFeatures && !container.querySelector('#result11')) {
        const div = document.createElement('div');
        div.id = 'result11';
        const hr = document.createElement('hr');
        hr.className = 'ui-pdp-hr';
        hr.style.cssText = 'border: none; border-top: 1px solid #ededed; margin: 16px 0;';
        specsFeatures.replaceWith(div, hr);
      }

      // result12: div with id="highlighted_specs_attrs" (Características do produto)
      let specsAttrs = container.querySelector('#highlighted_specs_attrs');
      // Fallback: find section containing "Características do produto" heading
      if (!specsAttrs) {
        const allSections = container.querySelectorAll('section.ui-vpp-highlighted-specs');
        allSections.forEach(sec => {
          const h2 = sec.querySelector('h2');
          if (h2 && h2.textContent?.includes('Características do produto')) {
            specsAttrs = sec;
          }
        });
      }
      if (specsAttrs && !container.querySelector('#result12')) {
        const parentRow = specsAttrs.closest('.ui-pdp-container__row.ui-pdp-html-description') || specsAttrs;
        const div = document.createElement('div');
        div.id = 'result12';
        
        // Add GroupedShareBookmark div between result11 and result12
        const shareBookmark = document.createElement('div');
        shareBookmark.className = 'ui-pdp-container__col col-1  ui-pdp-with--separator ui-pdp-with--separator--medium-top mt-20';
        shareBookmark.id = 'GroupedShareBookmark';
        
        // Add hr after result12
        const hr2 = document.createElement('hr');
        hr2.className = 'ui-pdp-hr';
        hr2.style.cssText = 'border: none; border-top: 1px solid #ededed; margin: 16px 0;';
        
        parentRow.replaceWith(shareBookmark, div, hr2);
      }

      // result13: p.ui-pdp-description__content
      const descContent = container.querySelector('p.ui-pdp-description__content');
      if (descContent && !container.querySelector('#result13')) {
        const div = document.createElement('div');
        div.id = 'result13';
        descContent.replaceWith(div);
      }

      // result14: p.ui-review-capability__rating__average
      const ratingAvg = container.querySelector('p.ui-review-capability__rating__average');
      if (ratingAvg && !container.querySelector('#result14')) {
        const div = document.createElement('div');
        div.id = 'result14';
        ratingAvg.replaceWith(div);
      }

      // result15: p.ui-review-capability__rating__label
      const ratingLabel = container.querySelector('p.ui-review-capability__rating__label');
      if (ratingLabel && !container.querySelector('#result15')) {
        const div = document.createElement('div');
        div.id = 'result15';
        ratingLabel.replaceWith(div);
      }

      // result16: ul.reviews-carousel-primary (fotos do produto)
      const carouselPrimary = container.querySelector('ul.reviews-carousel-primary');
      if (carouselPrimary && !container.querySelector('#result16')) {
        const div = document.createElement('div');
        div.id = 'result16';
        carouselPrimary.replaceWith(div);
      }

      // result17: div.ui-review-capability-comments (keep only the last one)
      if (!container.querySelector('#result17')) {
        const commentsBlocks = container.querySelectorAll('.ui-review-capability-comments');
        if (commentsBlocks.length > 0) {
          for (let i = 0; i < commentsBlocks.length - 1; i++) {
            commentsBlocks[i].remove();
          }
          const lastBlock = commentsBlocks[commentsBlocks.length - 1];
          const div = document.createElement('div');
          div.id = 'result17';
          lastBlock.replaceWith(div);
        }
      }
    };

    const injectFromDescription = () => {
      const desc = product?.description;
      if (!desc) return;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(desc, 'text/html');
        mobileSelectorMap.forEach(({ resultId, descSelector }) => {
          const resultEl = container.querySelector(`#${resultId}`);
          if (!resultEl) return;
          const found = doc.querySelector(descSelector);
          if (found) {
            resultEl.innerHTML = '';
            resultEl.appendChild(found.cloneNode(true));
          }
        });
      } catch (e) {
        console.warn('Error injecting description content (mobile):', e);
      }
    };

    const attachDescriptionExpand = () => {
      // Find all "Ver descrição completa" links by text content (injected elements may lack attributes)
      container.querySelectorAll('a').forEach(a => {
        if (a.textContent?.trim().startsWith('Ver descrição completa')) {
          a.style.cursor = 'pointer';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const collapsable = a.closest<HTMLElement>('.ui-pdp-collapsable') ||
              a.parentElement?.closest<HTMLElement>('.ui-pdp-collapsable') ||
              container.querySelector<HTMLElement>('.ui-pdp-collapsable--is-collapsed');
            if (collapsable) {
              collapsable.classList.remove('ui-pdp-collapsable--is-collapsed');
              collapsable.style.maxHeight = 'none';
              collapsable.style.overflow = 'visible';
              const inner = collapsable.querySelector<HTMLElement>('.ui-pdp-collapsable__container');
              if (inner) {
                inner.style.maxHeight = 'none';
                inner.style.overflow = 'visible';
              }
            }
            a.remove();
          });
        }
      });
    };

    doMobileReplace();
    injectFromDescription();
    attachDescriptionExpand();
    const raf = requestAnimationFrame(() => {
      doMobileReplace();
      injectFromDescription();
      attachDescriptionExpand();
    });
    return () => cancelAnimationFrame(raf);
  }, [isMobile, isMobileReady, sanitizedMobileHtml, slug, product]);

  // Inject real product data into DOM (desktop)  
  const desktopRef = useRef<HTMLDivElement>(null);

  // Desktop: bookmark/favorite button interaction
  useEffect(() => {
    if (isMobile) return;
    const container = desktopRef.current;
    if (!container) return;
    const bookmarkForm = container.querySelector('form.ui-pdp-bookmark') as HTMLElement | null;
    if (!bookmarkForm) return;
    let favorited = false;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      favorited = !favorited;
      const svgs = bookmarkForm.querySelectorAll('svg.ui-pdp-icon--bookmark') as NodeListOf<SVGElement>;
      const btn = bookmarkForm.querySelector('button') as HTMLElement | null;
      svgs.forEach(svg => {
        svg.style.fill = favorited ? '#3483fa' : '';
        svg.style.color = favorited ? '#3483fa' : '';
      });
      if (btn) {
        btn.setAttribute('aria-checked', String(favorited));
        btn.style.animation = 'bookmark-pulse 0.4s ease-out';
        btn.addEventListener('animationend', () => {
          btn.style.animation = '';
        }, { once: true });
      }
    };
    bookmarkForm.addEventListener('click', handler);
    return () => bookmarkForm.removeEventListener('click', handler);
  }, [isMobile, sanitizedDesktopHtml]);

  useEffect(() => {
    if (isMobile || !product) return;
    const container = desktopRef.current;
    if (!container) return;

    // Remove all href attributes from elements inside desktop main (except <use> and <link>)
    container.querySelectorAll('[href]').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag !== 'use' && tag !== 'link') {
        el.removeAttribute('href');
      }
    });

    // Remove "Opções de compra" block
    const pdpProducts = container.querySelector('.ui-pdp-products');
    if (pdpProducts) pdpProducts.remove();

    // Remove "MAIS VENDIDO" promotions pill block
    container.querySelectorAll('.ui-pdp-promotions-pill.ui-pdp-highlights').forEach(el => el.remove());
    injectProductData(container, product, cardSettings, currencySymbol, deliverySettings);
  }, [isMobile, product, cardSettings, currencySymbol, sanitizedDesktopHtml, deliverySettings]);

  // Desktop: populate "Quem viu este produto também comprou" recommendations by tags
  useEffect(() => {
    if (isMobile || !product) return;
    const container = desktopRef.current;
    if (!container) return;

    const timeout = setTimeout(() => {
      // Find "Mais baratos com envio do exterior" section and repurpose it
      const allRecoSections = container.querySelectorAll('.ui-recommendations-carousel-wrapper-ref') as NodeListOf<HTMLElement>;
      let recoSection: HTMLElement | null = null;
      allRecoSections.forEach(section => {
        const titleEl = section.querySelector('h2');
        const text = titleEl?.textContent?.toLowerCase() || '';
        if (text.includes('mais baratos com envio')) {
          recoSection = section;
          // Change title
          if (titleEl) titleEl.textContent = 'Quem viu este produto também comprou';
          // Update aria-label
          const ariaSection = section.querySelector('[aria-label*="Mais baratos"]');
          if (ariaSection) ariaSection.setAttribute('aria-label', 'Quem viu este produto também comprou');
        } else {
          section.style.display = 'none';
        }
      });

      if (!recoSection) {
        if (allRecoSections.length > 0) {
          recoSection = allRecoSections[0];
          const titleEl = recoSection.querySelector('h2');
          if (titleEl) titleEl.textContent = 'Quem viu este produto também comprou';
          allRecoSections.forEach((s, i) => { if (i > 0) s.style.display = 'none'; });
        } else {
          return;
        }
      }

      const currentTags: string[] = Array.isArray((product as any).tags) ? ((product as any).tags as string[]) : [];
      if (currentTags.length === 0) {
        (recoSection as HTMLElement).style.display = 'none';
        return;
      }

      const targetSection = recoSection as HTMLElement;

      const fetchRelated = async () => {
        const { data: allProducts } = await supabase
          .from('products')
          .select('id, name, slug, price, compare_price, image, tags, enable_pix, enable_boleto')
          .neq('id', product.id);

        if (!allProducts || allProducts.length === 0) {
          targetSection.style.display = 'none';
          return;
        }

        const related = allProducts.filter(p => {
          const pTags: string[] = Array.isArray(p.tags) ? (p.tags as string[]) : [];
          return pTags.some(t => currentTags.includes(t));
        });

        if (related.length < 1) {
          targetSection.style.display = 'none';
          return;
        }

        targetSection.style.display = '';

        // Find the carousel wrapper inside the snapped carousel
        const wrapper = targetSection.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement | null;
        if (!wrapper) return;

        wrapper.innerHTML = '';
        wrapper.style.transform = 'translate3d(0px, 0px, 0px)';

        related.forEach((p, index) => {
          const priceFmt = formatPrice(p.price, currencySymbol);
          const discount = calcDiscount(p.compare_price, p.price);
          const compareFmt = formatPrice(p.compare_price, currencySymbol);

          let priceHtml = '';
          if (discount > 0) {
            priceHtml = `
              <s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size: 12px;" data-andes-money-amount="true" data-andes-money-amount-size="12">
                <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
                <span class="andes-money-amount__fraction">${compareFmt.integer}</span>${centsSuffixHtml(compareFmt.cents, 12)}
              </s>
              <div class="poly-price__current">
                <span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size: 20px;" data-andes-money-amount="true" data-andes-money-amount-size="20">
                  <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
                  <span class="andes-money-amount__fraction">${priceFmt.integer}</span>${centsSuffixHtml(priceFmt.cents, 20)}
                </span>
                <span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">${discount}% OFF</span>
              </div>`;
          } else {
            priceHtml = `
              <div class="poly-price__current">
                <span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size: 20px;" data-andes-money-amount="true" data-andes-money-amount-size="20">
                  <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
                  <span class="andes-money-amount__fraction">${priceFmt.integer}</span>${centsSuffixHtml(priceFmt.cents, 20)}
                </span>
              </div>`;
          }

          if (cardSettings.enabled) {
            const installment = calcInstallment(p.price, cardSettings.free_installments, cardSettings.monthly_rate, cardSettings.free_installments);
            const installFmt = formatPrice(installment.value, currencySymbol);
            priceHtml += `<span class="poly-price__installments"><span style="color:rgba(0,0,0,0.9)">em</span> <span style="color:#00a650">${cardSettings.free_installments}x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size: inherit;">
              <span class="andes-money-amount__currency"><span class="andes-money-amount__currency-symbol">${currencySymbol}</span></span>
              <span class="andes-money-amount__fraction">${installFmt.integer}</span><span>,</span><span class="andes-money-amount__cents">${installFmt.cents}</span>
            </span> sem juros</span></span>`;
          } else {
            const rp = p as any;
            const hasPix = rp.enable_pix === true;
            const hasBoleto = rp.enable_boleto === true;
            let avistaText = 'À vista';
            if (hasPix && hasBoleto) avistaText = 'À vista no Pix e Boleto';
            else if (hasPix) avistaText = 'À vista no Pix';
            else if (hasBoleto) avistaText = 'À vista no Boleto';
            priceHtml += `<span class="poly-price__installments" style="color: rgb(0, 166, 80); font-weight: 600;">${avistaText}</span>`;
          }

          const slide = document.createElement('div');
          slide.setAttribute('role', 'group');
          slide.className = `andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-12 ${index === 0 ? 'andes-carousel-snapped__slide--active' : ''}`;
          slide.setAttribute('aria-label', `${index + 1} de ${related.length}`);
          slide.style.cssText = 'width: 227.2px; margin-right: 12px;';
          slide.innerHTML = `
            <div class="poly-andes-card poly-andes-card--flat recos-polycard poly-card poly-card--grid-card poly-card--large" style="cursor:pointer">
              <div class="poly-card__portada" style="display: flex; align-items: center; justify-content: center; padding: 8px; min-height: 160px;">
                <span class="poly-component__image-overlay"></span>
                <img class="poly-component__picture" alt="${p.name}" loading="lazy" decoding="async" src="${p.image || '/placeholder.svg'}" style="object-fit: contain; max-width: 180px; max-height: 180px; object-position: center; display: block; margin: 0 auto;">
              </div>
              <div class="poly-card__content">
                <a class="poly-component__title">${p.name}</a>
                <div class="poly-component__price">${priceHtml}</div>
                <div class="poly-component__shipping"><span>Frete grátis</span></div>
              </div>
            </div>`;

          slide.addEventListener('click', () => {
            if ((window as any).spaNavigate) {
              (window as any).spaNavigate(`/store/product/${p.slug}`);
            } else {
              window.location.href = `/store/product/${p.slug}`;
            }
          });

          wrapper.appendChild(slide);
        });

        // --- Carousel scroll logic for next/prev buttons ---
        const slideWidth = 227.2 + 12; // slide width + margin
        const carouselContainer = targetSection.querySelector('.andes-carousel-snapped__container, .andes-carousel-snapped') as HTMLElement | null;
        const visibleWidth = carouselContainer?.clientWidth || wrapper.parentElement?.clientWidth || 900;
        const slidesPerView = Math.floor(visibleWidth / slideWidth) || 4;
        let currentOffset = 0;
        const maxOffset = Math.max(0, (related.length - slidesPerView) * slideWidth);

        let nextBtn = targetSection.querySelector('button[data-andes-carousel-snapped-control="next"]') as HTMLElement | null;
        let prevBtn = targetSection.querySelector('button[data-andes-carousel-snapped-control="previous"]') as HTMLElement | null;

        // If prev button doesn't exist, create one
        if (!prevBtn && nextBtn) {
          const controlsWrapper = nextBtn.parentElement;
          if (controlsWrapper) {
            prevBtn = document.createElement('button');
            prevBtn.className = 'andes-carousel-snapped__control andes-carousel-snapped__control--previous andes-carousel-snapped__control--size-large andes-carousel-snapped__control--disabled';
            prevBtn.setAttribute('name', 'andes-carousel-snapped_control');
            prevBtn.setAttribute('data-andes-carousel-snapped-control', 'previous');
            prevBtn.setAttribute('data-andes-state', 'visible disabled');
            prevBtn.setAttribute('type', 'button');
            prevBtn.setAttribute('aria-label', 'Anterior');
            prevBtn.setAttribute('disabled', '');
            prevBtn.innerHTML = '<svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M20.0549 6.99999L11.0596 15.9953L20.0642 25L19.0036 26.0607L8.93823 15.9953L18.9942 5.93933L20.0549 6.99999Z" fill="currentColor"></path></svg>';
            controlsWrapper.insertBefore(prevBtn, nextBtn);
          }
        }

        const updateButtons = () => {
          if (prevBtn) {
            prevBtn.style.display = '';
            prevBtn.style.visibility = 'visible';
            prevBtn.style.opacity = '1';
            if (currentOffset <= 0) {
              prevBtn.setAttribute('disabled', '');
              prevBtn.classList.add('andes-carousel-snapped__control--disabled');
              prevBtn.setAttribute('data-andes-state', 'visible disabled');
            } else {
              prevBtn.removeAttribute('disabled');
              prevBtn.classList.remove('andes-carousel-snapped__control--disabled');
              prevBtn.setAttribute('data-andes-state', 'visible');
            }
          }
          if (nextBtn) {
            if (currentOffset >= maxOffset) {
              nextBtn.setAttribute('disabled', '');
              nextBtn.classList.add('andes-carousel-snapped__control--disabled');
              nextBtn.setAttribute('data-andes-state', 'visible disabled');
            } else {
              nextBtn.removeAttribute('disabled');
              nextBtn.classList.remove('andes-carousel-snapped__control--disabled');
              nextBtn.setAttribute('data-andes-state', '');
            }
          }
        };

        updateButtons();

        if (nextBtn) {
          const newNext = nextBtn.cloneNode(true) as HTMLElement;
          nextBtn.parentNode?.replaceChild(newNext, nextBtn);
          nextBtn = newNext;
          newNext.addEventListener('click', () => {
            currentOffset = Math.min(currentOffset + slidesPerView * slideWidth, maxOffset);
            wrapper.style.transform = `translate3d(-${currentOffset}px, 0px, 0px)`;
            wrapper.style.transition = 'transform 0.4s ease';
            updateButtons();
          });
        }

        if (prevBtn) {
          const newPrev = prevBtn.cloneNode(true) as HTMLElement;
          prevBtn.parentNode?.replaceChild(newPrev, prevBtn);
          prevBtn = newPrev;
          newPrev.addEventListener('click', () => {
            currentOffset = Math.max(currentOffset - slidesPerView * slideWidth, 0);
            wrapper.style.transform = `translate3d(-${currentOffset}px, 0px, 0px)`;
            wrapper.style.transition = 'transform 0.4s ease';
            updateButtons();
          });
        }
      };

      fetchRelated();
    }, 500);

    return () => clearTimeout(timeout);
  }, [isMobile, product, cardSettings, currencySymbol, sanitizedDesktopHtml]);

  useEffect(() => {
    if (isMobile || !product) return;
    const container = desktopRef.current;
    if (!container) return;
    const p = product as any;
    const variants = p.variants || [];

    // Remove any previously injected variants block
    container.querySelectorAll('.ui-pdp-variants-injected-desktop').forEach(el => el.remove());

    if (variants.length === 0) return;

    // Group variants by group_name
    const groups: Record<string, Array<{ option_name: string; id: string; image?: string; price?: number; stock?: number }>> = {};
    variants.forEach((v: any) => {
      if (!groups[v.group_name]) groups[v.group_name] = [];
      groups[v.group_name].push(v);
    });

    // Build HTML using the desktop model
    let pickersHtml = '';
    Object.entries(groups).forEach(([groupName, options]) => {
      const hasMultipleOptions = options.length > 1;
      const firstOption = options[0];

      if (hasMultipleOptions) {
        const hasImages = options.some((opt: any) => opt.image);

        if (hasImages) {
          // Desktop template with images (compact thumbnails, no price/stock shown)
          const itemsHtml = options.map((opt: any) => `
            <a class="ui-pdp-outside_variations__thumbnails__item ui-pdp-outside_variations__thumbnails__item--NONE ui-pdp-outside_variations__thumbnails__item--with-picture"
               data-testid="thumbnail-item" role="button" data-variant-id="${opt.id}" modifier="link">
              <img class="ui-pdp-image ui-pdp-outside_variations__thumbnails__item__picture" src="${opt.image}" decoding="async" alt="${opt.option_name}" loading="eager" />
            </a>
          `).join('');

          pickersHtml += `
            <div class="ui-pdp-outside_variations__picker" data-testid="PICKER-${groupName.toUpperCase().replace(/\s+/g, '_')}">
              <p class="ui-pdp-outside_variations__title">
                <span class="ui-pdp-outside_variations__title__label ui-pdp-color--BLACK">${groupName}:</span>
                <span class="ui-pdp-outside_variations__title__value ui-pdp-color--BLACK">Escolha</span>
              </p>
              <div class="ui-pdp-outside_variations__items ui-pdp-outside_variations__thumbnails">
                ${itemsHtml}
              </div>
            </div>
          `;
        } else {
          // Desktop template without images (text-only buttons)
          const itemsHtml = options.map(opt => `
            <a class="ui-pdp-outside_variations__thumbnails__item ui-pdp-outside_variations__thumbnails__item--NONE"
               data-testid="thumbnail-item" role="button" data-variant-id="${opt.id}" modifier="link">
              <p class="ui-pdp-color--BLACK ui-pdp-outside_variations__thumbnails__item__label">
                <span>${opt.option_name}</span>
              </p>
            </a>
          `).join('');

          pickersHtml += `
            <div class="ui-pdp-outside_variations__picker" data-testid="PICKER-${groupName.toUpperCase().replace(/\s+/g, '_')}">
              <p class="ui-pdp-outside_variations__title">
                <span class="ui-pdp-outside_variations__title__label ui-pdp-color--BLACK">${groupName}:</span>
                <span class="ui-pdp-outside_variations__title__value ui-pdp-color--BLACK">Escolha</span>
              </p>
              <div class="ui-pdp-outside_variations__items ui-pdp-outside_variations__thumbnails">
                ${itemsHtml}
              </div>
            </div>
          `;
        }
      } else {
        pickersHtml += `
          <div class="ui-pdp-outside_variations__picker">
            <p class="ui-pdp-outside_variations__title">
              <span class="ui-pdp-outside_variations__title__label ui-pdp-color--BLACK">${groupName}:</span>
              <span class="ui-pdp-outside_variations__title__value ui-pdp-color--BLACK">${firstOption.option_name}</span>
            </p>
          </div>
        `;
      }
    });

    const variantsHtml = `
      <div class="ui-pdp-outside_variations mt-24 ui-pdp-variants-injected-desktop">
        ${pickersHtml}
      </div>
    `;

    // Find price container in the desktop buybox and insert after it
    const priceContainer = container.querySelector('.ui-pdp-price') || container.querySelector('.ui-pdp-price__main-container');
    if (priceContainer) {
      priceContainer.insertAdjacentHTML('afterend', variantsHtml);
    }

    // Add click handlers for variant selection
    container.querySelectorAll('.ui-pdp-variants-injected-desktop .ui-pdp-outside_variations__thumbnails__item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const picker = item.closest('.ui-pdp-outside_variations__picker');
        if (!picker) return;
        picker.querySelectorAll('.ui-pdp-outside_variations__thumbnails__item').forEach(i => {
          i.classList.remove('ui-pdp-outside_variations__thumbnails__item--SELECTED');
          i.classList.add('ui-pdp-outside_variations__thumbnails__item--NONE');
        });
        item.classList.remove('ui-pdp-outside_variations__thumbnails__item--NONE');
        item.classList.add('ui-pdp-outside_variations__thumbnails__item--SELECTED');
        const titleValue = picker.querySelector('.ui-pdp-outside_variations__title__value');
        const optionLabel = item.querySelector('.ui-pdp-outside_variations__thumbnails__item__label span') || item;
        if (titleValue) {
          titleValue.textContent = optionLabel.textContent?.trim() || (item as HTMLElement).getAttribute('alt') || '';
        }
        // For image-only items, use img alt as label
        if (!optionLabel.textContent?.trim()) {
          const img = item.querySelector('img');
          if (img && titleValue) titleValue.textContent = img.alt || '';
        }
        const variantImg = item.querySelector('img.ui-pdp-outside_variations__thumbnails__item__picture') as HTMLImageElement | null;
        // Re-render price/installments with the selected variant's price & stock
        const variantId = item.getAttribute('data-variant-id');
        if (variantId) {
          const matched = ((product as any).variants || []).find((v: any) => v.id === variantId);
          if (matched) {
            const effectivePrice = matched.price > 0 ? matched.price : (product as any).price;
            const effectiveStock = matched.stock > 0 ? matched.stock : (product as any).stock;
            injectProductData(
              container,
              { ...product, price: effectivePrice, stock: effectiveStock } as any,
              cardSettings,
              currencySymbol,
              deliverySettings
            );
          }
        }
        // Swap main gallery image if variant has image (AFTER injectProductData to not be overwritten)
        if (variantImg && variantImg.src) {
          const galleryImgs = container.querySelectorAll<HTMLImageElement>(
            'img.ui-pdp-image.ui-pdp-gallery--horizontal, img.ui-pdp-image.ui-pdp-gallery__figure__image'
          );
          galleryImgs.forEach(mainImg => {
            mainImg.src = variantImg.src;
            mainImg.setAttribute('src', variantImg.src);
            mainImg.removeAttribute('srcset');
            if (mainImg.hasAttribute('data-zoom')) mainImg.setAttribute('data-zoom', variantImg.src);
          });
        }
      });
    });
  }, [isMobile, product, sanitizedDesktopHtml, currencySymbol, cardSettings, deliverySettings]);

  // Desktop: quantity selector popup on click
  useEffect(() => {
    if (isMobile || !product) return;
    const container = desktopRef.current;
    if (!container) return;

    const quantityEl = container.querySelector('#buybox_available_quantity') as HTMLElement | null;
    if (!quantityEl) return;

    // Make it look clickable
    quantityEl.style.cursor = 'pointer';

    const stock = (product as any).stock ?? 6;
    const maxQty = Math.min(stock, 6);

    const handleClick = (e: Event) => {
      e.stopPropagation();

      // Remove existing popup if open
      const existing = container.querySelector('.qty-popup-overlay');
      if (existing) { existing.remove(); return; }

      // Find the stock-and-full container to position popup below it
      const stockFullEl = container.querySelector('.ui-pdp-stock-and-full') as HTMLElement | null;
      const anchorEl = stockFullEl || quantityEl;

      const currentQty = selectedQty;
      const items = Array.from({ length: maxQty }, (_, i) => {
        const n = i + 1;
        const label = n === 1 ? '1 unidade' : `${n} unidades`;
        const selectedClass = n === currentQty ? ' andes-list__item--selected' : '';
        return `<li class="andes-list__item andes-list__item--size-medium${selectedClass}"
          role="option" aria-selected="${n === currentQty}" data-qty="${n}" tabindex="${n === currentQty ? 0 : -1}"
          style="padding: 10px 16px; cursor: pointer; list-style: none;">
          <div class="andes-list__item-first-column">
            <div class="andes-list__item-text">
              <span class="andes-list__item-primary">${label}</span>
            </div>
          </div>
        </li>`;
      }).join('');

      // Create popup element
      const overlay = document.createElement('div');
      overlay.className = 'qty-popup-overlay';
      overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9998;';

      const popupBox = document.createElement('div');
      const anchorRect = anchorEl.getBoundingClientRect();
      popupBox.style.cssText = `z-index: 9999; position: fixed; top: ${anchorRect.bottom + 4}px; left: ${anchorRect.left}px; background: #fff; border-radius: 6px; box-shadow: 0 1px 6px rgba(0,0,0,.12); min-width: 220px;`;
      popupBox.innerHTML = `
        <div class="ui-pdp-quantity-selector__list--default">
          <ul class="andes-list andes-list--dropdown andes-list--selectable" role="listbox" style="list-style: none; margin: 0; padding: 0;">
            ${items}
          </ul>
        </div>`;

      overlay.appendChild(popupBox);
      document.body.appendChild(overlay);

      // Handle item clicks - update text and selectedQty state
      popupBox.querySelectorAll('.andes-list__item').forEach(item => {
        item.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const qty = parseInt((item as HTMLElement).dataset.qty || '1', 10);
          const qtyText = qty === 1 ? '1 unidade' : `${qty} unidades`;

          // Update text in .ui-pdp-buybox__quantity__selected
          const selectedSpan = quantityEl.querySelector('.ui-pdp-buybox__quantity__selected');
          if (selectedSpan) {
            selectedSpan.textContent = qtyText;
          }

          // Update React state so addToCart uses correct quantity
          setSelectedQty(qty);

          overlay.remove();
        });
      });

      // Close on overlay click (outside popup)
      overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) overlay.remove();
      });
    };

    quantityEl.addEventListener('click', handleClick);
    return () => quantityEl.removeEventListener('click', handleClick);
  }, [isMobile, product, selectedQty, sanitizedDesktopHtml]);

  // Desktop: replace specific blocks with result placeholders + inject description content
  useEffect(() => {
    if (isMobile) return;
    const container = desktopRef.current;
    if (!container) return;

    const selectorMap: { resultId: string; pageSelector: string; fallbackSelectors?: string[]; descSelector: string }[] = [
      { resultId: 'result1', pageSelector: '#breadcrumb', fallbackSelectors: ['.ui-pdp-container__row--breadcrumb', '[class*="breadcrumb"]'], descSelector: 'div#breadcrumb' },
      { resultId: 'result2', pageSelector: '.ui-pdp-header__info', descSelector: 'div.ui-pdp-header__info' },
      { resultId: 'result3', pageSelector: '.ui-vpp-highlighted-specs__features', descSelector: 'ul.ui-vpp-highlighted-specs__features-list' },
      { resultId: 'result4', pageSelector: '#highlighted_specs_attrs', fallbackSelectors: ['section[id="highlighted_specs_attrs"]'], descSelector: 'section#highlighted_specs_attrs' },
      { resultId: 'result5', pageSelector: '.ui-pdp-description__content', fallbackSelectors: ['p[data-testid="content"]'], descSelector: 'div#description' },
      { resultId: 'result6', pageSelector: '.ui-review-capability__rating__average--desktop', fallbackSelectors: ['p.ui-review-capability__rating__average--desktop'], descSelector: 'p.ui-review-capability__rating__average.ui-review-capability__rating__average--desktop' },
      { resultId: 'result7', pageSelector: '.ui-review-capability__rating__label', fallbackSelectors: ['p.ui-review-capability__rating__label'], descSelector: 'p.ui-review-capability__rating__label' },
      { resultId: 'result8', pageSelector: '.ui-review-capability__reviews-carousel', descSelector: 'section.andes-carousel-snapped__container' },
      { resultId: 'result9', pageSelector: '.ui-review-capability-comments', descSelector: 'div.ui-review-capability-comments' },
    ];

    const doReplace = () => {
      let replaced = 0;
      selectorMap.forEach(({ resultId, pageSelector, fallbackSelectors }) => {
        if (container.querySelector(`#${resultId}`)) { replaced++; return; }
        let el = container.querySelector(pageSelector);
        if (!el && fallbackSelectors) {
          for (const fb of fallbackSelectors) {
            el = container.querySelector(fb);
            if (el) break;
          }
        }
        if (el) {
          const placeholder = document.createElement('div');
          placeholder.id = resultId;
          el.parentNode?.replaceChild(placeholder, el);
          replaced++;
        }
      });
      return replaced;
    };

    const injectFromDescription = () => {
      const desc = product?.description;
      if (!desc) return;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(desc, 'text/html');
        selectorMap.forEach(({ resultId, descSelector }) => {
          const resultEl = container.querySelector(`#${resultId}`);
          if (!resultEl) return;
          const found = doc.querySelector(descSelector);
          if (found) {
            resultEl.innerHTML = '';
            resultEl.appendChild(found.cloneNode(true));
          }
        });
      } catch (e) {
        console.warn('Error injecting description content (desktop):', e);
      }
    };

    const attachDescriptionExpand = () => {
      container.querySelectorAll('a').forEach(a => {
        if (a.textContent?.trim().startsWith('Ver descrição completa')) {
          a.style.cursor = 'pointer';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const collapsable = a.closest<HTMLElement>('.ui-pdp-collapsable') ||
              a.parentElement?.closest<HTMLElement>('.ui-pdp-collapsable') ||
              container.querySelector<HTMLElement>('.ui-pdp-collapsable--is-collapsed');
            if (collapsable) {
              collapsable.classList.remove('ui-pdp-collapsable--is-collapsed');
              collapsable.style.maxHeight = 'none';
              collapsable.style.overflow = 'visible';
              const inner = collapsable.querySelector<HTMLElement>('.ui-pdp-collapsable__container');
              if (inner) {
                inner.style.maxHeight = 'none';
                inner.style.overflow = 'visible';
              }
            }
            a.remove();
          });
        }
      });
    };

    const count = doReplace();
    injectFromDescription();
    attachDescriptionExpand();
    if (count < 9) {
      const raf = requestAnimationFrame(() => { doReplace(); injectFromDescription(); attachDescriptionExpand(); });
      return () => cancelAnimationFrame(raf);
    }
  }, [isMobile, isMobileReady, sanitizedDesktopHtml, slug, product]);

  // Desktop: collapsible sections interactivity
  useEffect(() => {
    if (isMobile) return;
    const container = desktopRef.current;
    if (!container) return;

    const expandWrapper = (trigger: HTMLElement) => {
      const wrapper =
        trigger.closest<HTMLElement>('.ui-pdp-collapsable') ||
        trigger.parentElement?.closest<HTMLElement>('.ui-pdp-collapsable') ||
        null;

      if (wrapper) {
        wrapper.classList.remove('ui-pdp-collapsable--is-collapsed');
        const inner = wrapper.querySelector<HTMLElement>('.ui-pdp-collapsable__container');
        if (inner) inner.style.maxHeight = 'none';
      }
    };

    const expandSpecs = (trigger: HTMLElement) => {
      expandWrapper(trigger);

      container
        .querySelectorAll<HTMLElement>('.ui-vpp-highlighted-specs__striped-specs--collapsed')
        .forEach((el) => {
          el.classList.remove('ui-vpp-highlighted-specs__striped-specs--collapsed');
          el.style.maxHeight = 'none';
        });

      const seeMoreContainer =
        trigger.closest<HTMLElement>('.ui-vpp-highlighted-specs__see-more') ||
        trigger.closest<HTMLElement>('.ui-pdp-container__row--technical-specifications');

      if (seeMoreContainer) {
        seeMoreContainer.style.display = 'none';
      } else {
        trigger.style.display = 'none';
      }
    };

    const expandDescription = (trigger: HTMLElement) => {
      // Remove collapsed state from wrapper
      expandWrapper(trigger);
      // Also directly find and expand the description collapsable container
      const collapsable = trigger.closest<HTMLElement>('.ui-pdp-collapsable') ||
        trigger.parentElement?.closest<HTMLElement>('.ui-pdp-collapsable');
      if (collapsable) {
        collapsable.style.maxHeight = 'none';
        collapsable.style.overflow = 'visible';
        const inner = collapsable.querySelector<HTMLElement>('.ui-pdp-collapsable__container');
        if (inner) {
          inner.style.maxHeight = 'none';
          inner.style.overflow = 'visible';
        }
      }
      // Hide the "Ver descrição completa" button
      trigger.remove();
    };

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const specsTrigger = target.closest<HTMLElement>(
        'button[data-testid="action-collapsable-target"].ui-vpp-highlighted-specs__striped-collapsed__action'
      );
      if (specsTrigger && container.contains(specsTrigger)) {
        event.preventDefault();
        expandSpecs(specsTrigger);
        return;
      }

      const descTrigger = target.closest<HTMLElement>(
        'a[data-testid="action-collapsable-target"]'
      ) || target.closest<HTMLElement>('.ui-pdp-collapsable__action.ui-pdp-description-collapse');
      if (descTrigger && container.contains(descTrigger)) {
        event.preventDefault();
        event.stopPropagation();
        // Directly expand the description collapsable
        const collapsable = container.querySelector<HTMLElement>('.ui-pdp-collapsable.ui-pdp-description-collapse.ui-pdp-collapsable--is-collapsed') ||
          descTrigger.closest<HTMLElement>('.ui-pdp-collapsable') ||
          descTrigger.parentElement?.closest<HTMLElement>('.ui-pdp-collapsable');
        if (collapsable) {
          collapsable.classList.remove('ui-pdp-collapsable--is-collapsed');
          collapsable.style.maxHeight = 'none';
          collapsable.style.overflow = 'visible';
          const inner = collapsable.querySelector<HTMLElement>('.ui-pdp-collapsable__container');
          if (inner) {
            inner.style.maxHeight = 'none';
            inner.style.overflow = 'visible';
          }
        }
        descTrigger.remove();
      }
    };

    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [isMobile, sanitizedDesktopHtml, slug]);

  // Desktop: wire buyer photos carousel (reviews-carousel-primary) next/prev buttons
  useEffect(() => {
    if (isMobile) return;
    const container = desktopRef.current;
    if (!container) return;

    const timeout = setTimeout(() => {
      const carouselSections = container.querySelectorAll('section[aria-label*="Fotos do produto"], section[aria-roledescription="Carrossel"]');
      carouselSections.forEach((section) => {
        const wrapper = section.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement;
        if (!wrapper) return;

        const slides = wrapper.querySelectorAll('.andes-carousel-snapped__slide');
        if (slides.length === 0) return;

        const firstSlide = slides[0] as HTMLElement;
        const slideStyle = getComputedStyle(firstSlide);
        const slideWidth = firstSlide.offsetWidth + parseFloat(slideStyle.marginRight || '0') + parseFloat(slideStyle.marginLeft || '0') + 12;
        const carouselEl = section.querySelector('.andes-carousel-snapped') as HTMLElement;
        const visibleWidth = carouselEl?.clientWidth || wrapper.parentElement?.clientWidth || 600;
        const slidesPerView = Math.max(1, Math.floor(visibleWidth / slideWidth));
        let currentOffset = 0;
        const maxOffset = Math.max(0, (slides.length - slidesPerView) * slideWidth);

        let nextBtn = section.querySelector('button[data-andes-carousel-snapped-control="next"]') as HTMLElement | null;
        let prevBtn = section.querySelector('button[data-andes-carousel-snapped-control="previous"]') as HTMLElement | null;

        const updateButtons = () => {
          if (prevBtn) {
            if (currentOffset <= 0) {
              prevBtn.setAttribute('disabled', '');
              prevBtn.classList.add('andes-carousel-snapped__control--disabled');
              prevBtn.setAttribute('data-andes-state', 'visible disabled');
            } else {
              prevBtn.removeAttribute('disabled');
              prevBtn.classList.remove('andes-carousel-snapped__control--disabled');
              prevBtn.setAttribute('data-andes-state', 'visible');
            }
          }
          if (nextBtn) {
            if (currentOffset >= maxOffset) {
              nextBtn.setAttribute('disabled', '');
              nextBtn.classList.add('andes-carousel-snapped__control--disabled');
              nextBtn.setAttribute('data-andes-state', 'visible disabled');
            } else {
              nextBtn.removeAttribute('disabled');
              nextBtn.classList.remove('andes-carousel-snapped__control--disabled');
              nextBtn.setAttribute('data-andes-state', '');
            }
          }
        };

        updateButtons();

        if (nextBtn) {
          const newNext = nextBtn.cloneNode(true) as HTMLElement;
          nextBtn.parentNode?.replaceChild(newNext, nextBtn);
          nextBtn = newNext;
          newNext.addEventListener('click', () => {
            currentOffset = Math.min(currentOffset + slidesPerView * slideWidth, maxOffset);
            wrapper.style.transform = `translate3d(-${currentOffset}px, 0px, 0px)`;
            wrapper.style.transition = 'transform 0.4s ease';
            updateButtons();
          });
        }

        if (prevBtn) {
          const newPrev = prevBtn.cloneNode(true) as HTMLElement;
          prevBtn.parentNode?.replaceChild(newPrev, prevBtn);
          prevBtn = newPrev;
          newPrev.addEventListener('click', () => {
            currentOffset = Math.max(currentOffset - slidesPerView * slideWidth, 0);
            wrapper.style.transform = `translate3d(-${currentOffset}px, 0px, 0px)`;
            wrapper.style.transition = 'transform 0.4s ease';
            updateButtons();
          });
        }
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [isMobile, sanitizedDesktopHtml, product]);

  // Helper to build a Product-compatible object for addToCart
  const buildCartProduct = useCallback((): Product | null => {
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: Number(product.price) || 0,
      compare_price: Number(product.compare_price) || 0,
      image: product.image || '',
      images: Array.isArray(product.images) ? product.images : [],
      stock: Number(product.stock) || 0,
      status: 'active',
      created_at: '',
      sales: product.sales || 0,
      visits: 0,
      weight: Number(product.weight) || 0,
      is_physical: true,
      condition: (product.condition as any) || 'new',
      checkout_type: (product.checkout_type as any) || 'native',
      payment_link: product.payment_link || undefined,
      fake_orders: product.fake_orders || 0,
      tags: [],
      pix_codes: [],
      boleto_codes: [],
      enable_pix: product.enable_pix ?? false,
      pix_type: 'copypaste',
      enable_boleto: product.enable_boleto ?? false,
    } as Product;
  }, [product]);

  // Mobile + Desktop: Buy Now / Add to Cart button handlers
  useEffect(() => {
    if (!product) return;
    const mContainer = mobileRef?.current;
    const dContainer = desktopRef?.current;
    const activeContainer = isMobile ? mContainer : dContainer;
    if (!activeContainer) return;

    const isExternal = product.checkout_type === 'external';

    // For external checkout: hide "Adicionar ao carrinho" button
    if (isExternal) {
      const addToCartBtn = activeContainer.querySelector<HTMLElement>('button.ui-pdp-action--secondary, button[formaction*="add-to-cart"]');
      if (addToCartBtn) addToCartBtn.style.display = 'none';
    }

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // "Comprar agora" button
      const buyBtn = target.closest<HTMLElement>(
        'button[data-andes-button-hierarchy="loud"], button[formaction*="checkout/buy"], button.ui-pdp-action--primary, button.andes-button--loud, form[action*="checkout/buy"] button, form[action*="checkout"] button'
      ) || (target.closest('button') && target.closest('button')?.textContent?.toLowerCase().includes('comprar') ? target.closest<HTMLElement>('button') : null);

      if (buyBtn && activeContainer.contains(buyBtn)) {
        e.preventDefault();
        e.stopPropagation();

        if (isExternal) {
          const selectedVariantEl = activeContainer.querySelector<HTMLElement>('.ui-pdp-outside_variations__thumbnails__item--SELECTED');
          const variantId = selectedVariantEl?.getAttribute('data-variant-id');
          let externalUrl = product.payment_link || '';
          
          if (variantId && product.variants) {
            const selectedVar = product.variants.find(v => v.id === variantId);
            if (selectedVar?.payment_link) {
              externalUrl = selectedVar.payment_link;
            }
          }
          
          if (externalUrl) {
            window.open(externalUrl, '_self');
          }
        } else {
          // Native checkout: add to cart and redirect to cart
          const cartProduct = buildCartProduct();
          if (cartProduct) {
            storeAddToCart(cartProduct, selectedQty);
            navigate('/store/cart');
          }
        }
        return;
      }

      // "Adicionar ao carrinho" button  
      const addBtn = target.closest<HTMLElement>('button.ui-pdp-action--secondary, button[data-andes-button-hierarchy="quiet"], button[formaction*="add-to-cart"]')
        || (target.closest('button') && target.closest('button')?.textContent?.toLowerCase().includes('adicionar ao carrinho') ? target.closest<HTMLElement>('button') : null);

      if (addBtn && activeContainer.contains(addBtn) && !isExternal) {
        e.preventDefault();
        e.stopPropagation();

        // Show loader animation
        const content = addBtn.querySelector<HTMLElement>('.andes-button__content');
        const originalContent = content?.innerHTML || '';
        if (content) {
          content.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;"><svg style="animation:spin 0.8s linear infinite;width:20px;height:20px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.42 31.42" stroke-dashoffset="10"/></svg></div>`;
        }
        addBtn.setAttribute('disabled', '');

        // Add to cart after brief delay for animation
        setTimeout(() => {
          const cartProduct = buildCartProduct();
          if (cartProduct) {
            storeAddToCart(cartProduct, selectedQty);
            setCartDrawerProduct({
              name: product.name,
              image: product.image || '/placeholder.svg',
              price: (Number(product.price) || 0) * selectedQty,
              quantity: selectedQty,
            });
            setShowCartDrawer(true);
          }
          // Restore button
          if (content) content.innerHTML = originalContent;
          addBtn.removeAttribute('disabled');
        }, 800);
        return;
      }
    };

    const handleFormSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const cartProduct = buildCartProduct();
      if (cartProduct) {
        storeAddToCart(cartProduct, selectedQty);
        navigate('/store/cart');
      }
    };

    activeContainer.addEventListener('click', handleClick, true);
    activeContainer.addEventListener('submit', handleFormSubmit, true);
    return () => {
      activeContainer.removeEventListener('click', handleClick, true);
      activeContainer.removeEventListener('submit', handleFormSubmit, true);
    };
  }, [isMobile, product, selectedQty, buildCartProduct, storeAddToCart, navigate, sanitizedMobileHtml, sanitizedDesktopHtml]);

  // Don't render until we know if it's mobile or desktop
  if (!isMobileReady) return null;

  // Product not found or inactive
  if (productNotFound) return null;

  // Anti-Crawler v1 — show CAPTCHA before rendering product
  if (crawlerCaptcha && crawlerProductData) {
    return (
      <CrawlerCaptcha
        onSolved={() => {
          setCrawlerCaptcha(false);
          setProduct(crawlerProductData);
          if (slug) {
            window.dispatchEvent(new CustomEvent('anti-product-unlocked', { detail: { slug } }));
          }
        }}
      />
    );
  }

  // Anti-Google / Anti-Meta landing page — product state is NOT set yet, so no product HTML exists in the DOM
  if (antiLanding && antiProductData) {
    const mainImage = antiProductData.image || (Array.isArray(antiProductData.images) && antiProductData.images.length > 0 ? String(antiProductData.images[0]) : '');
    const priceFormatted = antiProductData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '20px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          {mainImage && (
            <img
              src={mainImage}
              alt={antiProductData.name}
              style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: '8px', marginBottom: '24px' }}
            />
          )}
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'rgba(0,0,0,0.9)', marginBottom: '24px' }}>
            {currencySymbol} {priceFormatted}
          </div>
          <button
            onClick={() => {
              setAntiLanding(false);
              setProduct(antiProductData);
              if (slug) {
                window.dispatchEvent(new CustomEvent('anti-product-unlocked', { detail: { slug } }));
              }
            }}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
              background: '#3483fa',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            CONTINUAR
          </button>
        </div>
      </div>
    );
  }

  // Still loading or no product — show the yellow/blue loader
  if (!product) return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff159',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '4px solid #fff159',
          borderTop: '4px solid #3483fa',
          borderRadius: '50%',
          animation: 'store-loader-spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes store-loader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const cartDrawerModal = showCartDrawer && cartDrawerProduct && (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes cartDrawerSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes cartDrawerOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        .cart-drawer-overlay { position: fixed; inset: 0; z-index: 10000; animation: cartDrawerOverlayIn 0.3s ease; }
        .cart-drawer-overlay__bg { position: fixed; inset: 0; background: rgba(0,0,0,0.5); }
        .cart-drawer-sidebar { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw; background: #fff; animation: cartDrawerSlideIn 0.3s ease; display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,0.15); }
        @media (max-width: 767px) { .cart-drawer-sidebar { width: 100vw; } }
        .cart-drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #eee; }
        .cart-drawer-header__title { font-size: 18px; font-weight: 600; color: rgba(0,0,0,0.9); }
        .cart-drawer-close { background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; }
        .cart-drawer-body { flex: 1; padding: 20px; overflow-y: auto; }
        .cart-drawer-product { display: flex; gap: 16px; align-items: flex-start; }
        .cart-drawer-product__img { width: 80px; height: 80px; object-fit: contain; border-radius: 6px; border: 1px solid #eee; flex-shrink: 0; }
        .cart-drawer-product__info { flex: 1; }
        .cart-drawer-product__name { font-size: 14px; color: rgba(0,0,0,0.7); line-height: 1.4; margin-bottom: 8px; }
        .cart-drawer-product__price { font-size: 20px; font-weight: 600; color: rgba(0,0,0,0.9); }
        .cart-drawer-product__qty { font-size: 13px; color: rgba(0,0,0,0.55); margin-top: 4px; }
        .cart-drawer-check { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
        .cart-drawer-check svg { color: #00a650; flex-shrink: 0; }
        .cart-drawer-check span { font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.9); }
        .cart-drawer-footer { padding: 16px 20px; border-top: 1px solid #eee; display: flex; flex-direction: column; gap: 10px; }
        .cart-drawer-btn-primary { width: 100%; padding: 14px; background: #3483fa; color: #fff; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .cart-drawer-btn-primary:hover { background: #2968c8; }
        .cart-drawer-btn-secondary { width: 100%; padding: 14px; background: transparent; color: #3483fa; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .cart-drawer-btn-secondary:hover { background: rgba(52,131,250,0.06); }
      `}} />
      <div className="cart-drawer-overlay">
        <div className="cart-drawer-overlay__bg" onClick={() => setShowCartDrawer(false)} />
        <div className="cart-drawer-sidebar" role="dialog" aria-modal="true">
          <div className="cart-drawer-header">
            <span className="cart-drawer-header__title">Adicionado ao carrinho</span>
            <button className="cart-drawer-close" aria-label="Fechar" onClick={() => setShowCartDrawer(false)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="rgba(0,0,0,0.55)">
                <path d="M4.35156 5.19496L9.15406 9.99746L4.35156 14.8L5.20009 15.6485L10.0026 10.846L14.7963 15.6397L15.6449 14.7912L10.8511 9.99746L15.6449 5.20371L14.7963 4.35518L10.0026 9.14894L5.20009 4.34644L4.35156 5.19496Z" fill="rgba(0,0,0,0.55)" />
              </svg>
            </button>
          </div>
          <div className="cart-drawer-body">
            <div className="cart-drawer-check">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#00a650" />
                <path d="M7 12.5L10.5 16L17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Produto adicionado ao carrinho</span>
            </div>
            <div className="cart-drawer-product">
              <img className="cart-drawer-product__img" src={cartDrawerProduct.image} alt={cartDrawerProduct.name} />
              <div className="cart-drawer-product__info">
                <div className="cart-drawer-product__name">{cartDrawerProduct.name}</div>
                <div className="cart-drawer-product__price">{currencySymbol} {Math.floor(cartDrawerProduct.price).toLocaleString('pt-BR')}</div>
                <div className="cart-drawer-product__qty">Quantidade: {cartDrawerProduct.quantity}</div>
              </div>
            </div>
          </div>
          <div className="cart-drawer-footer">
            <button className="cart-drawer-btn-primary" onClick={() => { setShowCartDrawer(false); navigate('/store/cart'); }}>
              Ir para o carrinho
            </button>
            <button className="cart-drawer-btn-secondary" onClick={() => setShowCartDrawer(false)}>
              Escolher mais produtos
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const reviewLightboxModal = reviewLightbox && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', color: '#fff' }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {reviewLightbox.index + 1} / {reviewLightbox.images.length}
        </span>
        <button onClick={() => setReviewLightbox(null)} aria-label="Fechar" type="button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="#fff">
            <path d="M4.35156 5.19496L9.15406 9.99746L4.35156 14.8L5.20009 15.6485L10.0026 10.846L14.7963 15.6397L15.6449 14.7912L10.8511 9.99746L15.6449 5.20371L14.7963 4.35518L10.0026 9.14894L5.20009 4.34644L4.35156 5.19496Z" />
          </svg>
        </button>
      </div>
      {/* Image */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', touchAction: 'pan-y' }}
        onTouchStart={(e) => {
          (e.currentTarget as any)._startX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const startX = (e.currentTarget as any)._startX;
          if (startX === undefined) return;
          const endX = e.changedTouches[0].clientX;
          const dx = endX - startX;
          if (dx < -50 && reviewLightbox.index < reviewLightbox.images.length - 1) {
            setReviewLightbox({ ...reviewLightbox, index: reviewLightbox.index + 1 });
          } else if (dx > 50 && reviewLightbox.index > 0) {
            setReviewLightbox({ ...reviewLightbox, index: reviewLightbox.index - 1 });
          }
        }}
      >
        <img
          src={reviewLightbox.images[reviewLightbox.index]}
          alt={`Opinião ${reviewLightbox.index + 1}`}
          style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }}
          draggable={false}
        />
      </div>
      {/* Navigation arrows */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, padding: '16px 0 24px' }}>
        <button
          onClick={() => reviewLightbox.index > 0 && setReviewLightbox({ ...reviewLightbox, index: reviewLightbox.index - 1 })}
          disabled={reviewLightbox.index === 0}
          style={{ background: 'none', border: 'none', cursor: reviewLightbox.index === 0 ? 'default' : 'pointer', padding: 12, opacity: reviewLightbox.index === 0 ? 0.3 : 1 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => reviewLightbox.index < reviewLightbox.images.length - 1 && setReviewLightbox({ ...reviewLightbox, index: reviewLightbox.index + 1 })}
          disabled={reviewLightbox.index === reviewLightbox.images.length - 1}
          style={{ background: 'none', border: 'none', cursor: reviewLightbox.index === reviewLightbox.images.length - 1 ? 'default' : 'pointer', padding: 12, opacity: reviewLightbox.index === reviewLightbox.images.length - 1 ? 0.3 : 1 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );



  // Mobile: render full HTML base
  if (isMobile) {
    return (
      <>
        {!pageReady && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff159' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #fff159', borderTop: '4px solid #3483fa', borderRadius: '50%', animation: 'store-loader-spin 0.8s linear infinite' }} />
            <style>{`@keyframes store-loader-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        <style dangerouslySetInnerHTML={{ __html: `
          hr.ui-pdp-hr {
            margin: 40px 0 !important;
            margin-top: 32px !important;
          }
          div#result13 div h2.ui-pdp-description__title {
            display: none !important;
          }
          .ui-review-capability-comments__comment__carousel--secondary {
            width: auto !important;
          }
          @media screen and (max-width: 767px) {
            .andes-carousel-snapped__slide.reviews-carousel-secondary.ui-review-capability-carousel__carousel-slide.andes-carousel-snapped__slide--spacing-12 {
              width: revert !important;
            }
            .andes-carousel-snapped__slide.reviews-carousel-primary.ui-review-capability-carousel__carousel-slide.andes-carousel-snapped__slide--spacing-12 {
              width: calc(33% - 9px) !important;
            }
          }
        `}} />
        <div dangerouslySetInnerHTML={{ __html: productSvgSprites }} />
        <div ref={mobileRef} dangerouslySetInnerHTML={{ __html: sanitizedMobileHtml }} />
        {showQuestionsModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
            <div onClick={() => setShowQuestionsModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div onClick={(e) => e.stopPropagation()} className="ui-vpp-questions-ai" style={{ width: '100%', background: '#fff', borderRadius: '12px 12px 0 0', padding: '24px 16px', animation: 'slideUp .3s ease', position: 'relative' }}>
                <button className="ui-vpp-questions-ai-close-btn" aria-label="Fechar" type="button" onClick={() => setShowQuestionsModal(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', zIndex: 1, padding: 8 }}>
                  <svg className="ui-vpp-questions-ai-icon--close" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="rgba(0,0,0,0.55)">
                    <path d="M4.35156 5.19496L9.15406 9.99746L4.35156 14.8L5.20009 15.6485L10.0026 10.846L14.7963 15.6397L15.6449 14.7912L10.8511 9.99746L15.6449 5.20371L14.7963 4.35518L10.0026 9.14894L5.20009 4.34644L4.35156 5.19496Z" fill="rgba(0,0,0,0.55)" />
                  </svg>
                </button>
                <div className="ui-pdp-container__row ui-pdp-container__row--questions-ai-title">
                  <div className="ui-vpp-questions-ai-title">
                    <p className="ui-pdp-color--BLACK ui-pdp-size--MEDIUM ui-pdp-family--SEMIBOLD ui-vpp-questions-ai-title__text">
                      <span>O que você precisa saber sobre este produto?</span>
                    </p>
                  </div>
                </div>
                <div className="ui-pdp-container__row ui-pdp-container__row--questions-ai-form" style={{ marginTop: 16 }}>
                  <div className="ui-vpp-questions-ai-form">
                    <form className="ui-vpp-questions-ai-form__andes-form" method="POST" onSubmit={(e) => e.preventDefault()}>
                      <div className="ui-vpp-questions-ai-form__content">
                        <div className="andes-form-control andes-form-control--textfield ui-vpp-questions-ai-form__input andes-form-control--multiline">
                          <div className="andes-form-control__control">
                            <textarea name="question" autoComplete="off" className="andes-form-control__field andes-form-control__field--multiline" maxLength={120} style={{ overflowX: 'hidden', overflowWrap: 'break-word', height: 96, width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: 12, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Digite sua pergunta..." rows={1} />
                          </div>
                        </div>
                      </div>
                      <div className="ui-vpp-questions-ai-form__actions" style={{ marginTop: 12 }}>
                        <button type="submit" className="andes-button andes-button--large andes-button--loud andes-button--full-width" style={{ width: '100%', padding: '12px 0', background: '#3483fa', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                          <span className="andes-button__content">
                            <span className="andes-button__text">Perguntar</span>
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showQuantityModal && product && (
          <div className="andes-modal__portal" data-andes-portal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
            <div className="andes-modal__overlay andes-modal__overlay--card" onClick={() => setShowQuantityModal(false)}>
              <div data-testid="backdrop-modal" role="dialog" tabIndex={-1}
                className="andes-modal ui-pdp-backdrop-modal andes-modal--card"
                data-ismodal="true" aria-modal="true"
                onClick={(e) => e.stopPropagation()}>
                <button className="andes-modal__close-button" aria-label="Fechar" type="button"
                  onClick={() => setShowQuantityModal(false)}>
                  <svg aria-hidden="true" color="white" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.35156 5.19496L9.15406 9.99746L4.35156 14.8L5.20009 15.6485L10.0026 10.846L14.7963 15.6397L15.6449 14.7912L10.8511 9.99746L15.6449 5.20371L14.7963 4.35518L10.0026 9.14894L5.20009 4.34644L4.35156 5.19496Z" fill="currentColor" />
                  </svg>
                </button>
                <div className="andes-modal__scroll">
                  <div className="andes-modal__content">
                    <h4 className="ui-pdp-buybox__quantity__title ui-pdp-buybox__quantity__title--no-subtitles">Escolha quantidade</h4>
                    <ul className="ui-pdp-buybox__quantity__list">
                      {Array.from({ length: Math.min(product.stock || 6, 6) }, (_, i) => i + 1).map(qty => (
                        <li key={qty}
                          className={`ui-pdp-buybox__quantity__item${selectedQty === qty ? ' ui-pdp-buybox__quantity__item--selected' : ''}`}>
                          <button type="button" data-testid="quantity-button"
                            id={`ui-pdp-buybox__quantity__item-button-${qty}`}
                            onClick={() => { setSelectedQty(qty); setShowQuantityModal(false); }}>
                            {qty} unidade{qty > 1 ? 's' : ''}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {reviewLightboxModal}
        {cartDrawerModal}
      </>
    );
  }

  // Desktop: render full HTML base
  return (
    <>
      {!pageReady && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff159' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #fff159', borderTop: '4px solid #3483fa', borderRadius: '50%', animation: 'store-loader-spin 0.8s linear infinite' }} />
          <style>{`@keyframes store-loader-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .ui-review-capability-categories__rating { display: ruby; }
        .ui-review-capability-comments__comment__rating { display: ruby; }
        @media screen and (min-width: 768px) {
          .ui-review-capability-comments__comment__content { white-space: unset !important; }
          .ui-pdp-icon.ui-pdp-icon--message-positive.ui-seller-data-status__info-icon { display: -webkit-inline-box !important; }
          .ui-pdp-icon.ui-pdp-icon--time-positive.ui-seller-data-status__info-icon { display: -webkit-inline-box !important; }
          .andes-carousel-snapped__slide.reviews-carousel-primary.ui-review-capability-carousel__carousel-slide.andes-carousel-snapped__slide--spacing-12 { width: calc(24.5% - 9px) !important; }
          .andes-carousel-snapped__slide.reviews-carousel-secondary.ui-review-capability-carousel__carousel-slide.andes-carousel-snapped__slide--spacing-12 { width: revert !important; }
        }
        p.ui-reviews-label-icon { display: ruby; }
        div#result5 div h2 { display: none !important; }
        .ui-review-capability-filter__desktop-filters { display: none !important; }
        h3.andes-typography.ui-review-capability-comments__title.andes-typography--type-title.andes-typography--size-16px.andes-typography--color-primary.andes-typography--weight-regular { display: none !important; }
        .ui-review-capability__summary { display: none !important; }
        .ui-review-capability-filter { margin-top: 10%; }
      `}} />
      <div dangerouslySetInnerHTML={{ __html: productSvgSprites }} />
      <div key={`desktop-${slug ?? 'default'}`} ref={desktopRef} dangerouslySetInnerHTML={{ __html: sanitizedDesktopHtml }} />
      {reviewLightboxModal}
      {cartDrawerModal}
    </>
  );
};

export default StoreProduct;
