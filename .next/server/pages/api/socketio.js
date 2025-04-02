"use strict";
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
exports.id = "pages/api/socketio";
exports.ids = ["pages/api/socketio"];
exports.modules = {

/***/ "socket.io":
/*!****************************!*\
  !*** external "socket.io" ***!
  \****************************/
/***/ ((module) => {

module.exports = import("socket.io");;

/***/ }),

/***/ "(api)/./pages/api/socketio.js":
/*!*******************************!*\
  !*** ./pages/api/socketio.js ***!
  \*******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var socket_io__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! socket.io */ \"socket.io\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([socket_io__WEBPACK_IMPORTED_MODULE_0__]);\nsocket_io__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n\nconst SocketIOHandler = (req, res)=>{\n    if (res.socket.server.io) {\n        console.log(\"Socket.IO is already running\");\n        res.end();\n        return;\n    }\n    console.log(\"Setting up Socket.IO...\");\n    const io = new socket_io__WEBPACK_IMPORTED_MODULE_0__.Server(res.socket.server, {\n        path: \"/api/socketio\",\n        addTrailingSlash: false\n    });\n    res.socket.server.io = io;\n    // Set up Socket.IO event handlers\n    io.on(\"connection\", (socket)=>{\n        console.log(\"New client connected\", socket.id);\n        // Handle joining a project room\n        socket.on(\"join-project\", (projectId)=>{\n            socket.join(`project-${projectId}`);\n            console.log(`Client ${socket.id} joined project-${projectId}`);\n        });\n        // Handle image reordering events\n        socket.on(\"reorder-images\", ({ projectId , dayId , images , userId  })=>{\n            // Broadcast to all clients in the project room except the sender\n            socket.to(`project-${projectId}`).emit(\"images-reordered\", {\n                dayId,\n                images,\n                userId\n            });\n            console.log(`Client ${socket.id} reordered images in day ${dayId} of project ${projectId}`);\n        });\n        // Handle disconnection\n        socket.on(\"disconnect\", ()=>{\n            console.log(\"Client disconnected\", socket.id);\n        });\n    });\n    console.log(\"Socket.IO server started\");\n    res.end();\n};\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (SocketIOHandler);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaSkvLi9wYWdlcy9hcGkvc29ja2V0aW8uanMuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBbUM7QUFFbkMsTUFBTUMsZUFBZSxHQUFHLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxHQUFLO0lBQ3BDLElBQUlBLEdBQUcsQ0FBQ0MsTUFBTSxDQUFDQyxNQUFNLENBQUNDLEVBQUUsRUFBRTtRQUN4QkMsT0FBTyxDQUFDQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUM1Q0wsR0FBRyxDQUFDTSxHQUFHLEVBQUUsQ0FBQztRQUNWLE9BQU87SUFDVCxDQUFDO0lBRURGLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFFdkMsTUFBTUYsRUFBRSxHQUFHLElBQUlOLDZDQUFNLENBQUNHLEdBQUcsQ0FBQ0MsTUFBTSxDQUFDQyxNQUFNLEVBQUU7UUFDdkNLLElBQUksRUFBRSxlQUFlO1FBQ3JCQyxnQkFBZ0IsRUFBRSxLQUFLO0tBQ3hCLENBQUM7SUFFRlIsR0FBRyxDQUFDQyxNQUFNLENBQUNDLE1BQU0sQ0FBQ0MsRUFBRSxHQUFHQSxFQUFFLENBQUM7SUFFMUIsa0NBQWtDO0lBQ2xDQSxFQUFFLENBQUNNLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQ1IsTUFBTSxHQUFLO1FBQzlCRyxPQUFPLENBQUNDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRUosTUFBTSxDQUFDUyxFQUFFLENBQUMsQ0FBQztRQUUvQyxnQ0FBZ0M7UUFDaENULE1BQU0sQ0FBQ1EsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDRSxTQUFTLEdBQUs7WUFDdkNWLE1BQU0sQ0FBQ1csSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFRCxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcENQLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFSixNQUFNLENBQUNTLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsaUNBQWlDO1FBQ2pDVixNQUFNLENBQUNRLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUVFLFNBQVMsR0FBRUUsS0FBSyxHQUFFQyxNQUFNLEdBQUVDLE1BQU0sR0FBRSxHQUFLO1lBQ3BFLGlFQUFpRTtZQUNqRWQsTUFBTSxDQUFDZSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUVMLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQ00sSUFBSSxDQUFDLGtCQUFrQixFQUFFO2dCQUN6REosS0FBSztnQkFDTEMsTUFBTTtnQkFDTkMsTUFBTTthQUNQLENBQUMsQ0FBQztZQUNIWCxPQUFPLENBQUNDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRUosTUFBTSxDQUFDUyxFQUFFLENBQUMseUJBQXlCLEVBQUVHLEtBQUssQ0FBQyxZQUFZLEVBQUVGLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RixDQUFDLENBQUMsQ0FBQztRQUVILHVCQUF1QjtRQUN2QlYsTUFBTSxDQUFDUSxFQUFFLENBQUMsWUFBWSxFQUFFLElBQU07WUFDNUJMLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLHFCQUFxQixFQUFFSixNQUFNLENBQUNTLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSE4sT0FBTyxDQUFDQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUN4Q0wsR0FBRyxDQUFDTSxHQUFHLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxpRUFBZVIsZUFBZSxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc21tLWNvbnRlbnQtY2FsZW5kYXIvLi9wYWdlcy9hcGkvc29ja2V0aW8uanM/ZWQ1NSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZXJ2ZXIgfSBmcm9tICdzb2NrZXQuaW8nO1xuXG5jb25zdCBTb2NrZXRJT0hhbmRsZXIgPSAocmVxLCByZXMpID0+IHtcbiAgaWYgKHJlcy5zb2NrZXQuc2VydmVyLmlvKSB7XG4gICAgY29uc29sZS5sb2coJ1NvY2tldC5JTyBpcyBhbHJlYWR5IHJ1bm5pbmcnKTtcbiAgICByZXMuZW5kKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc29sZS5sb2coJ1NldHRpbmcgdXAgU29ja2V0LklPLi4uJyk7XG4gIFxuICBjb25zdCBpbyA9IG5ldyBTZXJ2ZXIocmVzLnNvY2tldC5zZXJ2ZXIsIHtcbiAgICBwYXRoOiAnL2FwaS9zb2NrZXRpbycsXG4gICAgYWRkVHJhaWxpbmdTbGFzaDogZmFsc2VcbiAgfSk7XG4gIFxuICByZXMuc29ja2V0LnNlcnZlci5pbyA9IGlvO1xuXG4gIC8vIFNldCB1cCBTb2NrZXQuSU8gZXZlbnQgaGFuZGxlcnNcbiAgaW8ub24oJ2Nvbm5lY3Rpb24nLCAoc29ja2V0KSA9PiB7XG4gICAgY29uc29sZS5sb2coJ05ldyBjbGllbnQgY29ubmVjdGVkJywgc29ja2V0LmlkKTtcblxuICAgIC8vIEhhbmRsZSBqb2luaW5nIGEgcHJvamVjdCByb29tXG4gICAgc29ja2V0Lm9uKCdqb2luLXByb2plY3QnLCAocHJvamVjdElkKSA9PiB7XG4gICAgICBzb2NrZXQuam9pbihgcHJvamVjdC0ke3Byb2plY3RJZH1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGBDbGllbnQgJHtzb2NrZXQuaWR9IGpvaW5lZCBwcm9qZWN0LSR7cHJvamVjdElkfWApO1xuICAgIH0pO1xuXG4gICAgLy8gSGFuZGxlIGltYWdlIHJlb3JkZXJpbmcgZXZlbnRzXG4gICAgc29ja2V0Lm9uKCdyZW9yZGVyLWltYWdlcycsICh7IHByb2plY3RJZCwgZGF5SWQsIGltYWdlcywgdXNlcklkIH0pID0+IHtcbiAgICAgIC8vIEJyb2FkY2FzdCB0byBhbGwgY2xpZW50cyBpbiB0aGUgcHJvamVjdCByb29tIGV4Y2VwdCB0aGUgc2VuZGVyXG4gICAgICBzb2NrZXQudG8oYHByb2plY3QtJHtwcm9qZWN0SWR9YCkuZW1pdCgnaW1hZ2VzLXJlb3JkZXJlZCcsIHtcbiAgICAgICAgZGF5SWQsXG4gICAgICAgIGltYWdlcyxcbiAgICAgICAgdXNlcklkXG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUubG9nKGBDbGllbnQgJHtzb2NrZXQuaWR9IHJlb3JkZXJlZCBpbWFnZXMgaW4gZGF5ICR7ZGF5SWR9IG9mIHByb2plY3QgJHtwcm9qZWN0SWR9YCk7XG4gICAgfSk7XG5cbiAgICAvLyBIYW5kbGUgZGlzY29ubmVjdGlvblxuICAgIHNvY2tldC5vbignZGlzY29ubmVjdCcsICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdDbGllbnQgZGlzY29ubmVjdGVkJywgc29ja2V0LmlkKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coJ1NvY2tldC5JTyBzZXJ2ZXIgc3RhcnRlZCcpO1xuICByZXMuZW5kKCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTb2NrZXRJT0hhbmRsZXI7XG4iXSwibmFtZXMiOlsiU2VydmVyIiwiU29ja2V0SU9IYW5kbGVyIiwicmVxIiwicmVzIiwic29ja2V0Iiwic2VydmVyIiwiaW8iLCJjb25zb2xlIiwibG9nIiwiZW5kIiwicGF0aCIsImFkZFRyYWlsaW5nU2xhc2giLCJvbiIsImlkIiwicHJvamVjdElkIiwiam9pbiIsImRheUlkIiwiaW1hZ2VzIiwidXNlcklkIiwidG8iLCJlbWl0Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(api)/./pages/api/socketio.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(api)/./pages/api/socketio.js"));
module.exports = __webpack_exports__;

})();