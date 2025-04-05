/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./context/ThemeContext.js":
/*!*********************************!*\
  !*** ./context/ThemeContext.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"ThemeProvider\": () => (/* binding */ ThemeProvider),\n/* harmony export */   \"useTheme\": () => (/* binding */ useTheme)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n\n\nconst ThemeContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();\nfunction ThemeProvider({ children  }) {\n    const { 0: isDarkMode , 1: setIsDarkMode  } = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        // Check if user has a theme preference in localStorage\n        const savedTheme = localStorage.getItem(\"theme\");\n        if (savedTheme) {\n            setIsDarkMode(savedTheme === \"dark\");\n        } else {\n            // Check system preference\n            const prefersDark = window.matchMedia(\"(prefers-color-scheme: dark)\").matches;\n            setIsDarkMode(prefersDark);\n        }\n    }, []);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        // Update document class and localStorage when theme changes\n        if (isDarkMode) {\n            document.documentElement.classList.add(\"dark\");\n            localStorage.setItem(\"theme\", \"dark\");\n        } else {\n            document.documentElement.classList.remove(\"dark\");\n            localStorage.setItem(\"theme\", \"light\");\n        }\n    }, [\n        isDarkMode\n    ]);\n    const toggleTheme = ()=>{\n        setIsDarkMode(!isDarkMode);\n    };\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(ThemeContext.Provider, {\n        value: {\n            isDarkMode,\n            toggleTheme\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Gleb\\\\Desktop\\\\web smm calendar\\\\SMMCalendar\\\\context\\\\ThemeContext.js\",\n        lineNumber: 36,\n        columnNumber: 5\n    }, this);\n}\nfunction useTheme() {\n    const context = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(ThemeContext);\n    if (!context) {\n        throw new Error(\"useTheme must be used within a ThemeProvider\");\n    }\n    return context;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb250ZXh0L1RoZW1lQ29udGV4dC5qcy5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUF1RTtBQUV2RSxNQUFNSSxZQUFZLGlCQUFHSixvREFBYSxFQUFFO0FBRTdCLFNBQVNLLGFBQWEsQ0FBQyxFQUFFQyxRQUFRLEdBQUUsRUFBRTtJQUMxQyxNQUFNLEtBQUNDLFVBQVUsTUFBRUMsYUFBYSxNQUFJTCwrQ0FBUSxDQUFDLEtBQUssQ0FBQztJQUVuREQsZ0RBQVMsQ0FBQyxJQUFNO1FBQ2QsdURBQXVEO1FBQ3ZELE1BQU1PLFVBQVUsR0FBR0MsWUFBWSxDQUFDQyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ2hELElBQUlGLFVBQVUsRUFBRTtZQUNkRCxhQUFhLENBQUNDLFVBQVUsS0FBSyxNQUFNLENBQUMsQ0FBQztRQUN2QyxPQUFPO1lBQ0wsMEJBQTBCO1lBQzFCLE1BQU1HLFdBQVcsR0FBR0MsTUFBTSxDQUFDQyxVQUFVLENBQUMsOEJBQThCLENBQUMsQ0FBQ0MsT0FBTztZQUM3RVAsYUFBYSxDQUFDSSxXQUFXLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0gsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVBWLGdEQUFTLENBQUMsSUFBTTtRQUNkLDREQUE0RDtRQUM1RCxJQUFJSyxVQUFVLEVBQUU7WUFDZFMsUUFBUSxDQUFDQyxlQUFlLENBQUNDLFNBQVMsQ0FBQ0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9DVCxZQUFZLENBQUNVLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEMsT0FBTztZQUNMSixRQUFRLENBQUNDLGVBQWUsQ0FBQ0MsU0FBUyxDQUFDRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbERYLFlBQVksQ0FBQ1UsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN6QyxDQUFDO0lBQ0gsQ0FBQyxFQUFFO1FBQUNiLFVBQVU7S0FBQyxDQUFDLENBQUM7SUFFakIsTUFBTWUsV0FBVyxHQUFHLElBQU07UUFDeEJkLGFBQWEsQ0FBQyxDQUFDRCxVQUFVLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQscUJBQ0UsOERBQUNILFlBQVksQ0FBQ21CLFFBQVE7UUFBQ0MsS0FBSyxFQUFFO1lBQUVqQixVQUFVO1lBQUVlLFdBQVc7U0FBRTtrQkFDdERoQixRQUFROzs7OztZQUNhLENBQ3hCO0FBQ0osQ0FBQztBQUVNLFNBQVNtQixRQUFRLEdBQUc7SUFDekIsTUFBTUMsT0FBTyxHQUFHekIsaURBQVUsQ0FBQ0csWUFBWSxDQUFDO0lBQ3hDLElBQUksQ0FBQ3NCLE9BQU8sRUFBRTtRQUNaLE1BQU0sSUFBSUMsS0FBSyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUNELE9BQU9ELE9BQU8sQ0FBQztBQUNqQixDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc21tLWNvbnRlbnQtY2FsZW5kYXIvLi9jb250ZXh0L1RoZW1lQ29udGV4dC5qcz82NjM2Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNvbnRleHQsIHVzZUNvbnRleHQsIHVzZUVmZmVjdCwgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XHJcblxyXG5jb25zdCBUaGVtZUNvbnRleHQgPSBjcmVhdGVDb250ZXh0KCk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gVGhlbWVQcm92aWRlcih7IGNoaWxkcmVuIH0pIHtcclxuICBjb25zdCBbaXNEYXJrTW9kZSwgc2V0SXNEYXJrTW9kZV0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICAvLyBDaGVjayBpZiB1c2VyIGhhcyBhIHRoZW1lIHByZWZlcmVuY2UgaW4gbG9jYWxTdG9yYWdlXHJcbiAgICBjb25zdCBzYXZlZFRoZW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3RoZW1lJyk7XHJcbiAgICBpZiAoc2F2ZWRUaGVtZSkge1xyXG4gICAgICBzZXRJc0RhcmtNb2RlKHNhdmVkVGhlbWUgPT09ICdkYXJrJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBDaGVjayBzeXN0ZW0gcHJlZmVyZW5jZVxyXG4gICAgICBjb25zdCBwcmVmZXJzRGFyayA9IHdpbmRvdy5tYXRjaE1lZGlhKCcocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspJykubWF0Y2hlcztcclxuICAgICAgc2V0SXNEYXJrTW9kZShwcmVmZXJzRGFyayk7XHJcbiAgICB9XHJcbiAgfSwgW10pO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgLy8gVXBkYXRlIGRvY3VtZW50IGNsYXNzIGFuZCBsb2NhbFN0b3JhZ2Ugd2hlbiB0aGVtZSBjaGFuZ2VzXHJcbiAgICBpZiAoaXNEYXJrTW9kZSkge1xyXG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZGFyaycpO1xyXG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndGhlbWUnLCAnZGFyaycpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2RhcmsnKTtcclxuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3RoZW1lJywgJ2xpZ2h0Jyk7XHJcbiAgICB9XHJcbiAgfSwgW2lzRGFya01vZGVdKTtcclxuXHJcbiAgY29uc3QgdG9nZ2xlVGhlbWUgPSAoKSA9PiB7XHJcbiAgICBzZXRJc0RhcmtNb2RlKCFpc0RhcmtNb2RlKTtcclxuICB9O1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPFRoZW1lQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17eyBpc0RhcmtNb2RlLCB0b2dnbGVUaGVtZSB9fT5cclxuICAgICAge2NoaWxkcmVufVxyXG4gICAgPC9UaGVtZUNvbnRleHQuUHJvdmlkZXI+XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVzZVRoZW1lKCkge1xyXG4gIGNvbnN0IGNvbnRleHQgPSB1c2VDb250ZXh0KFRoZW1lQ29udGV4dCk7XHJcbiAgaWYgKCFjb250ZXh0KSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VzZVRoZW1lIG11c3QgYmUgdXNlZCB3aXRoaW4gYSBUaGVtZVByb3ZpZGVyJyk7XHJcbiAgfVxyXG4gIHJldHVybiBjb250ZXh0O1xyXG59ICJdLCJuYW1lcyI6WyJjcmVhdGVDb250ZXh0IiwidXNlQ29udGV4dCIsInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiVGhlbWVDb250ZXh0IiwiVGhlbWVQcm92aWRlciIsImNoaWxkcmVuIiwiaXNEYXJrTW9kZSIsInNldElzRGFya01vZGUiLCJzYXZlZFRoZW1lIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInByZWZlcnNEYXJrIiwid2luZG93IiwibWF0Y2hNZWRpYSIsIm1hdGNoZXMiLCJkb2N1bWVudCIsImRvY3VtZW50RWxlbWVudCIsImNsYXNzTGlzdCIsImFkZCIsInNldEl0ZW0iLCJyZW1vdmUiLCJ0b2dnbGVUaGVtZSIsIlByb3ZpZGVyIiwidmFsdWUiLCJ1c2VUaGVtZSIsImNvbnRleHQiLCJFcnJvciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./context/ThemeContext.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/react */ \"next-auth/react\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _context_ThemeContext__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../context/ThemeContext */ \"./context/ThemeContext.js\");\n/* harmony import */ var react_hot_toast__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-hot-toast */ \"react-hot-toast\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_4__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([react_hot_toast__WEBPACK_IMPORTED_MODULE_3__]);\nreact_hot_toast__WEBPACK_IMPORTED_MODULE_3__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\n\n\n\n\nfunction MyApp({ Component , pageProps: { session , ...pageProps }  }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_auth_react__WEBPACK_IMPORTED_MODULE_1__.SessionProvider, {\n        session: session,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_ThemeContext__WEBPACK_IMPORTED_MODULE_2__.ThemeProvider, {\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                    ...pageProps\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\Gleb\\\\Desktop\\\\web smm calendar\\\\SMMCalendar\\\\pages\\\\_app.js\",\n                    lineNumber: 10,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_hot_toast__WEBPACK_IMPORTED_MODULE_3__.Toaster, {\n                    position: \"bottom-right\",\n                    toastOptions: {\n                        duration: 3000,\n                        style: {\n                            background: \"#333\",\n                            color: \"#fff\"\n                        },\n                        success: {\n                            duration: 3000,\n                            theme: {\n                                primary: \"#4aed88\"\n                            }\n                        },\n                        error: {\n                            duration: 4000,\n                            theme: {\n                                primary: \"#ff4b4b\"\n                            }\n                        }\n                    }\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\Gleb\\\\Desktop\\\\web smm calendar\\\\SMMCalendar\\\\pages\\\\_app.js\",\n                    lineNumber: 11,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"C:\\\\Users\\\\Gleb\\\\Desktop\\\\web smm calendar\\\\SMMCalendar\\\\pages\\\\_app.js\",\n            lineNumber: 9,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"C:\\\\Users\\\\Gleb\\\\Desktop\\\\web smm calendar\\\\SMMCalendar\\\\pages\\\\_app.js\",\n        lineNumber: 8,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQWtEO0FBQ007QUFDZDtBQUNYO0FBRS9CLFNBQVNHLEtBQUssQ0FBQyxFQUFFQyxTQUFTLEdBQUVDLFNBQVMsRUFBRSxFQUFFQyxPQUFPLEdBQUUsR0FBR0QsU0FBUyxFQUFFLEdBQUUsRUFBRTtJQUNsRSxxQkFDRSw4REFBQ0wsNERBQWU7UUFBQ00sT0FBTyxFQUFFQSxPQUFPO2tCQUMvQiw0RUFBQ0wsZ0VBQWE7OzhCQUNaLDhEQUFDRyxTQUFTO29CQUFFLEdBQUdDLFNBQVM7Ozs7O3dCQUFJOzhCQUM1Qiw4REFBQ0gsb0RBQU87b0JBQ05LLFFBQVEsRUFBQyxjQUFjO29CQUN2QkMsWUFBWSxFQUFFO3dCQUNaQyxRQUFRLEVBQUUsSUFBSTt3QkFDZEMsS0FBSyxFQUFFOzRCQUNMQyxVQUFVLEVBQUUsTUFBTTs0QkFDbEJDLEtBQUssRUFBRSxNQUFNO3lCQUNkO3dCQUNEQyxPQUFPLEVBQUU7NEJBQ1BKLFFBQVEsRUFBRSxJQUFJOzRCQUNkSyxLQUFLLEVBQUU7Z0NBQ0xDLE9BQU8sRUFBRSxTQUFTOzZCQUNuQjt5QkFDRjt3QkFDREMsS0FBSyxFQUFFOzRCQUNMUCxRQUFRLEVBQUUsSUFBSTs0QkFDZEssS0FBSyxFQUFFO2dDQUNMQyxPQUFPLEVBQUUsU0FBUzs2QkFDbkI7eUJBQ0Y7cUJBQ0Y7Ozs7O3dCQUNEOzs7Ozs7Z0JBQ1k7Ozs7O1lBQ0EsQ0FDbEI7QUFDSixDQUFDO0FBRUQsaUVBQWVaLEtBQUssRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3NtbS1jb250ZW50LWNhbGVuZGFyLy4vcGFnZXMvX2FwcC5qcz9lMGFkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNlc3Npb25Qcm92aWRlciB9IGZyb20gJ25leHQtYXV0aC9yZWFjdCc7XG5pbXBvcnQgeyBUaGVtZVByb3ZpZGVyIH0gZnJvbSAnLi4vY29udGV4dC9UaGVtZUNvbnRleHQnO1xuaW1wb3J0IHsgVG9hc3RlciB9IGZyb20gJ3JlYWN0LWhvdC10b2FzdCc7XG5pbXBvcnQgJy4uL3N0eWxlcy9nbG9iYWxzLmNzcyc7XG5cbmZ1bmN0aW9uIE15QXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHM6IHsgc2Vzc2lvbiwgLi4ucGFnZVByb3BzIH0gfSkge1xuICByZXR1cm4gKFxuICAgIDxTZXNzaW9uUHJvdmlkZXIgc2Vzc2lvbj17c2Vzc2lvbn0+XG4gICAgICA8VGhlbWVQcm92aWRlcj5cbiAgICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxuICAgICAgICA8VG9hc3RlclxuICAgICAgICAgIHBvc2l0aW9uPVwiYm90dG9tLXJpZ2h0XCJcbiAgICAgICAgICB0b2FzdE9wdGlvbnM9e3tcbiAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAwLFxuICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyMzMzMnLFxuICAgICAgICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHtcbiAgICAgICAgICAgICAgZHVyYXRpb246IDMwMDAsXG4gICAgICAgICAgICAgIHRoZW1lOiB7XG4gICAgICAgICAgICAgICAgcHJpbWFyeTogJyM0YWVkODgnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiB7XG4gICAgICAgICAgICAgIGR1cmF0aW9uOiA0MDAwLFxuICAgICAgICAgICAgICB0aGVtZToge1xuICAgICAgICAgICAgICAgIHByaW1hcnk6ICcjZmY0YjRiJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfX1cbiAgICAgICAgLz5cbiAgICAgIDwvVGhlbWVQcm92aWRlcj5cbiAgICA8L1Nlc3Npb25Qcm92aWRlcj5cbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgTXlBcHA7XG4iXSwibmFtZXMiOlsiU2Vzc2lvblByb3ZpZGVyIiwiVGhlbWVQcm92aWRlciIsIlRvYXN0ZXIiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsInNlc3Npb24iLCJwb3NpdGlvbiIsInRvYXN0T3B0aW9ucyIsImR1cmF0aW9uIiwic3R5bGUiLCJiYWNrZ3JvdW5kIiwiY29sb3IiLCJzdWNjZXNzIiwidGhlbWUiLCJwcmltYXJ5IiwiZXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "next-auth/react":
/*!**********************************!*\
  !*** external "next-auth/react" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("next-auth/react");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react-hot-toast":
/*!**********************************!*\
  !*** external "react-hot-toast" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = import("react-hot-toast");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/_app.js"));
module.exports = __webpack_exports__;

})();