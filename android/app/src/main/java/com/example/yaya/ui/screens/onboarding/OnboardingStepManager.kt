package com.example.yaya.ui.screens.onboarding

class OnboardingStepManager {

    fun validate(state: OnboardingUiState): String? {
        return when (state.step) {
            OnboardingStep.BUSINESS_TYPE -> {
                if (state.businessType.isBlank()) "Selecciona un tipo de negocio"
                else null
            }
            OnboardingStep.BUSINESS_INFO -> {
                when {
                    state.businessName.isBlank() -> "Ingresa el nombre de tu negocio"
                    state.phoneNumber.isBlank() -> "Ingresa tu numero de telefono"
                    else -> null
                }
            }
            else -> null
        }
    }

    fun nextStep(current: OnboardingStep): StepResult? {
        val steps = OnboardingStep.entries
        val currentIndex = steps.indexOf(current)
        if (currentIndex < steps.size - 1) {
            return StepResult(steps[currentIndex + 1], currentIndex + 1)
        }
        return null
    }

    fun previousStep(current: OnboardingStep): StepResult? {
        if (current == OnboardingStep.WELCOME) return null
        val steps = OnboardingStep.entries
        val currentIndex = steps.indexOf(current)
        if (currentIndex > 0) {
            return StepResult(steps[currentIndex - 1], currentIndex - 1)
        }
        return null
    }

    fun canSkip(step: OnboardingStep): Boolean {
        return step == OnboardingStep.WHATSAPP_CONNECTION ||
                step == OnboardingStep.FIRST_PRODUCT
    }

    data class StepResult(val step: OnboardingStep, val index: Int)
}
