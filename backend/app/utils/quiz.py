def check_answer(question, user_answer):
    """
    문제 유형에 따라 정답을 비교하는 함수
    """
    if question.question_type == 1:  # OX 문제
        return user_answer.strip().upper() == question.correct_answer.strip().upper()
    
    elif question.question_type == 2:  # 객관식 문제
        return user_answer.strip().upper() == question.correct_answer.strip().upper()
    
    elif question.question_type == 3:  # 단답형 문제
        return user_answer.strip().lower() == question.correct_answer.strip().lower()
    
    return False  # 유형이 없는 경우 기본값


