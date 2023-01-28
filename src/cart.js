const contenedorProductos = document.getElementById('contenedor-productos');
const contenedorCarrito = document.getElementById('carrito-contenedor');

const botonTerminar = document.getElementById('terminar')
const finCompra = document.getElementById('fin-compra')

const contadorCarrito = document.getElementById('contadorCarrito');
const precioTotal = document.getElementById('precioTotal');

const selecTipos = document.getElementById('selecTipos')
const buscador = document.getElementById('search')

const botonVaciar = document.getElementById('vaciarCarrito')
const FinCompra = document.getElementById('finCompra')

const cantidad = document.getElementById('cantidad')
const cantidadTotal = document.getElementById('cantidadTotal')

let carritoDeCompras = []

document.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('carritoDeCompras')){
        carritoDeCompras = JSON.parse(localStorage.getItem('carritoDeCompras'))
        carritoLS()
    }
})


const carritoLS = () => {
    contenedorCarrito.innerHTML = ""

    carritoDeCompras.forEach((productoAgregar) => {
        const div = document.createElement ('div')
        div.className = ('productoEnCarrito')
        div.innerHTML = `
        <p>${productoAgregar.nombre}</p>
        <p>Precio: $${productoAgregar.precio}</p>
        <p>Cantidad: <span id="cantidad">${productoAgregar.cantidad}</span></p>
        <button id="eliminar${productoAgregar.id}" class="boton-eliminar">
            <i class="fas fa-trash-alt"></i>
        </button>`

        contenedorCarrito.appendChild(div) 

        let btnEliminar = document.getElementById(`eliminar${productoAgregar.id}`)
        btnEliminar.addEventListener('click',()=>{
        btnEliminar.parentElement.remove()
        carritoDeCompras = carritoDeCompras.filter(elemento => elemento.id !== productoAgregar.id)
        console.log(carritoDeCompras);
        actualizarCarrito()
    })



    })
    contadorCarrito.innerText = carritoDeCompras.length
    precioTotal.innerText = carritoDeCompras.reduce((acc,el)=> acc + el.precio, 0)

}


selecTipos.addEventListener('change',()=>{
    console.log(selecTipos.value);
    if(selecTipos.value == 'all'){
        mostrarProductos(stockProductos)
    }else{
        let arrayNuevo = stockProductos.filter(elemento => elemento.tipo === selecTipos.value)
        console.log(arrayNuevo);
        mostrarProductos(arrayNuevo)
    }
})



mostrarProductos(stockProductos)


function mostrarProductos(array){

    contenedorProductos.innerHTML = ""

    array.forEach(el => {
    let div = document.createElement('div')

    div.classList.add('producto')
    div.innerHTML= `<div class="card">
                        <div class="card-image">
                            <img src="${el.img}">
                            <span class="card-title">${el.nombre}</span>
                            <a id="boton${el.id}" class="addCarrito"><i class="material-icons">add_shopping_cart</i></a>
                        </div>
                        <div class="card-content">
                            <p>${el.tipo}</p>
                            <p>${el.desc}</p>
                            <span><p> $${el.precio}</p></span>
                        </div>
                    </div>`

    contenedorProductos.appendChild(div)

    const btnAgregar = document.getElementById(`boton${el.id}`)
    
    btnAgregar.addEventListener('click',()=>{
        agregarAlCarrito(el.id);
    })

  })


}

botonVaciar.addEventListener('click', () => {
    carritoDeCompras.length = 0 
    carritoDeCompras.length === 0 && swal("🛒 El carrito se encuentra vacío.");
    actualizarCarrito()
})

const agregarAlCarrito = (id) => {

    const existe = carritoDeCompras.some (obj => obj.id === id)

    if (existe){
        const obj = carritoDeCompras.map (obj => {
            if (obj.id === id){
                obj.cantidad++
            }
        })
    } else {

    const productoAgregar = stockProductos.find((obj)=> obj.id === id)
    carritoDeCompras.push(productoAgregar)
    mostrarCarrito(productoAgregar)
    console.log(carritoDeCompras)
        
}
actualizarCarrito()
}

const eliminar = (id) => {
    const productoAgregar = carritoDeCompras.find((productoAgregar) => obj.id === id)
    const indice = carritoDeCompras.indexOf(productoAgregar)
    carritoDeCompras.splice(indice, 1)
    actualizarCarrito()

}


function mostrarCarrito(productoAgregar) {

   let div = document.createElement('div')
    div.setAttribute('class', 'productoEnCarrito')
    div.innerHTML=`<p>${productoAgregar.nombre}</p>
                    <p>Precio: $${productoAgregar.precio}</p>
                    <p>Cantidad: <span id="cantidad">${productoAgregar.cantidad}</span></p>
                    <button id="eliminar${productoAgregar.id}" class="boton-eliminar"><i class="fas fa-trash-alt"></i></button>`
    contenedorCarrito.appendChild(div)

 
    let btnEliminar = document.getElementById(`eliminar${productoAgregar.id}`)
    btnEliminar.addEventListener('click',()=>{
        btnEliminar.parentElement.remove()
        carritoDeCompras = carritoDeCompras.filter(elemento => elemento.id !== productoAgregar.id)
        console.log(carritoDeCompras);
        actualizarCarrito()
    })

    localStorage.setItem('carritoDeCompras', JSON.stringify(carritoDeCompras)) 

}



function  actualizarCarrito (){
    contadorCarrito.innerText = carritoDeCompras.length
    precioTotal.innerText = carritoDeCompras.reduce((acc,el)=> acc + el.precio, 0)
    
}                                                          

const btnFinCompra = document.getElementById(`finCompra`)
    
    btnFinCompra.addEventListener('click',()=>{
        carritoDeCompras.length === 0 ? swal("🛒 El carrito se encuentra vacío.") :
        swal("Excelente!", "Su compra ha sido finalizada!", "success");

    })