// Composable để sử dụng animations dễ dàng

export function useAnimations() {
  // Thêm class animation vào element
  const addAnimation = (element, animationClass, duration = 500) => {
    if (!element) return
    
    element.classList.add(animationClass)
    
    setTimeout(() => {
      element.classList.remove(animationClass)
    }, duration)
  }

  // Success animation khi thêm vào giỏ hàng
  const animateAddToCart = (element) => {
    addAnimation(element, 'pulse', 300)
  }

  // Error animation khi có lỗi
  const animateError = (element) => {
    addAnimation(element, 'shake', 500)
  }

  // Success animation khi cập nhật thành công
  const animateSuccess = (element) => {
    addAnimation(element, 'bounce', 300)
  }

  // Loading animation
  const animateLoading = (element) => {
    element?.classList.add('rotate')
  }

  const stopLoading = (element) => {
    element?.classList.remove('rotate')
  }

  // Glow effect cho notification
  const animateGlow = (element) => {
    addAnimation(element, 'glow', 1500)
  }

  // Confetti effect cho success lớn
  const showConfetti = () => {
    // Tạo confetti elements
    const colors = ['#8B7355', '#7FA650', '#D4A574', '#C97064']
    const confettiCount = 50
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.style.position = 'fixed'
      confetti.style.width = '10px'
      confetti.style.height = '10px'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.top = '-10px'
      confetti.style.opacity = Math.random()
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`
      confetti.classList.add('confetti')
      
      document.body.appendChild(confetti)
      
      setTimeout(() => {
        confetti.remove()
      }, 3000)
    }
  }

  return {
    addAnimation,
    animateAddToCart,
    animateError,
    animateSuccess,
    animateLoading,
    stopLoading,
    animateGlow,
    showConfetti
  }
}
