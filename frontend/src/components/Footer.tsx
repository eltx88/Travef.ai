const Footer = () => {
  return (
    <footer className="bg-blue-600 text-white py-0">
        <div className="container mx-auto px-4">
          <p className="text-sm text-center">© 2024 Travefai. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2">
          <a href="/privacy-policy" className="text-sm hover:underline">Privacy Policy</a>
          <a href="/terms-of-service" className="text-sm hover:underline">Terms of Service</a>
          <a href="/contact" className="text-sm hover:underline">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 