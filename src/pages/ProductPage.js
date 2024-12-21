import React, { useState, useRef } from "react";
import "../styles/components/ProductPage.css";
import { FaTrash } from "react-icons/fa";
import products from "./Products.json";
import { db, auth } from "../services/firebase";
import { addDoc, collection, getFirestore, setDoc, doc } from "firebase/firestore"; // Firebase Firestore import
import { useNavigate } from 'react-router-dom';

const ProductPage = () => {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({});
  const [orderNo, setOrderNo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [additionalReq, setAdditionalReq] = useState('');
  const itemsPerPage = 8; // Number of products per page
 
  const navigate = useNavigate()

  const quotationRef = useRef(null); // Create a reference for the Quotation Summary section

  const categories = Array.from(new Set(products.map((product) => product.category)));

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setFilteredProducts(
      products.filter((product) =>
        product.name.toLowerCase().includes(query)
      )
    );
    setCurrentPage(1); // Reset to the first page on search
  };

  

  const filterByCategory = (category) => {
    setFilteredProducts(
      category === "All"
        ? products
        : products.filter((product) => product.category === category)
    );
    setCurrentPage(1); // Reset to the first page on filter change
  };

  const addToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);
    setTimeout(() => {
      // Scroll to the Quotation Summary section
      quotationRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((product) => product.id !== productId));
    setFormData((prevData) => {
      const newData = { ...prevData };
      delete newData[productId];
      return newData;
    });
  };

  const handleFormChange = (productId, field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [productId]: {
        ...prevData[productId],
        [field]: value,
      },
    }));
  };

  const handleSubmitProductForm = async (productId) => {
    const productData = formData[productId];
    
  
    
   
  
    // Ensure clientName is a string.
    const formattedClientName = typeof clientName === 'string' ? clientName : clientName?.a;
  
    // Prepare data for Firebase
    const dataToSubmit = {
      clientName: clientName || "Unknown", // Ensure the clientName is always a string
      clientPhone: clientPhone,
      clientEmail: clientEmail,
      city: clientCity,
      postalCode: postalCode,
      product: {
        productName: cart.find((item) => item.id === productId)?.name || "Unknown",
        height: height,
        width: width,
        additionalRequirements: additionalReq|| "",
        status:"Pending"
      },
      userId: auth.currentUser?.uid || "Anonymous",
      orderNumber: Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
    };
  
    try {
      // Save to Firebase
      const quotationRef = collection(db, "Quotation_form");
      await setDoc(doc(quotationRef, String(dataToSubmit.orderNumber)), dataToSubmit);

      const productName = cart.find((item) => item.id === productId)?.name || "Unknown"; // Retrieve product name
      await addDoc(collection(db, "Notification"), {
        message: `Your Quotation #${dataToSubmit.orderNumber} for ${productName} has been submitted to admin for review.`,
        createdAt: new Date(),
        userId: dataToSubmit.userId, // Ensure userId is referenced properly
        orderNumber: dataToSubmit.orderNumber, // Store order number for reference
        read: "false",
        type:"alert"
      });
  
      alert(`Quotation submitted successfully! Order Number: ${dataToSubmit.orderNumber}`);
    } catch (error) {
      console.error("Error submitting quotation:", error);
      alert(error);
      return;
    }
  
    // Remove the submitted product from the cart
    setCart((prevCart) =>
      prevCart.filter((product) => product.id !== productId)
    );
  
    // Remove form data for the submitted product
    setFormData((prevData) => {
      const newData = { ...prevData };
      delete newData[productId];
      return newData;
    });
  
    // Close popup if no more active products remain
    if (cart.length === 1) {
      setShowPopup(false);
    }
  };
  

 
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  return (
    <div className="product-page">
      <h1>Product Catalog</h1>

      {/* Search and Filter Section */}
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search products..."
          onChange={handleSearch}
        />
        <select onChange={(e) => filterByCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Product List */}
      <div className="product-list">
        {displayedProducts.map((product) => (
          <div key={product.id} className="product-card">
             <div 
        className="product-card-info"
        onClick={() => navigate(`/product-details/${product.id}`)} // Navigate to product details
      >
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
        />
        <h3>{product.name}</h3>
        <p>{product.category}</p>
      </div>
            <button onClick={() => addToCart(product)}>Add to Quotation</button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className={currentPage === 1 ? "disabled" : ""}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={currentPage === index + 1 ? "active" : ""}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className={currentPage === totalPages ? "disabled" : ""}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      {/* Cart Section */}
      <div className="cart" ref={quotationRef}>
        <h2>Quotation Summary</h2>
        {cart.length > 0 ? (
          <>
            <ul>
              {cart.map((item) => (
                <li key={item.id} className="cart-item">
                  {item.name}
                  <FaTrash
                    className="delete-icon"
                    onClick={() => removeFromCart(item.id)}
                  />
                </li>
              ))}
            </ul>
            <button
              className="submit-button1"
              onClick={() => setShowPopup(true)}
              style={{ backgroundColor: "orange", fontWeight: "bold" }}
            >
              Proceed
            </button>
          </>
        ) : (
          <p>No products in quotation.</p>
        )}
      </div>

      {/* Quotation Form Popup */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h2>Quotation Form</h2>

            {/* Tabs for Switching Between Products */}
            <div className="tabs">
              {cart.map((product, index) => (
                <button
                  key={product.id}
                  className={activeTab === index ? "active-tab" : ""}
                  onClick={() => setActiveTab(index)}
                >
                  {product.name}
                </button>
              ))}
            </div>

            {/* Client Details Section */}
            <div className="form-section">
              <h3>Client Details</h3>
              <label>
                Client Name:
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </label>
              <label>
                Client Email:
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail( e.target.value)}
                />
              </label>
              <label>
                Client Phone:
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </label>
              <label>
                City:
                <input
                  type="text"
                  required
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                />
              </label>
              <label>
                Postal Code:
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode( e.target.value)}
                />
              </label>
            </div>

            {/* Product Details Section */}
            <div className="form-section">
              <h3>Product Details</h3>

              {/* Form for Active Product */}
              {cart.length > 0 && (
                <div className="product-form">
                  <label>
                    Selected Product:
                    <input type="text" value={cart[activeTab]?.name} readOnly/>
                  </label>
                  <label>
                    Height (ft):
                    <input
                      type="number"
                      required
                      value={height}
                      onChange={(e) =>
                        setHeight( e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Width (ft):{width}
                    <input
                      type="number"
                      required
                      value={width}
                      onChange={(e) =>
                        setWidth( e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Additional Requirements:
                    <textarea
                        value={additionalReq}
                      onChange={(e) =>
                        setAdditionalReq(
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>
              )}
            </div>

            <button className="close-button" onClick={() => setShowPopup(false)}>
              Close
            </button>
            <button
              className="submit-button"
              onClick={() => handleSubmitProductForm(cart[activeTab]?.id)}
            >
              Submit Product
            </button>
          </div>
        </div>
      )}

    
    </div>
  );
};

export default ProductPage;
